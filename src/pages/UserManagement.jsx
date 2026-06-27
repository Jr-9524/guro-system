import { useCallback, useEffect, useState } from "react";
import { KeyRound, ShieldCheck, UserPlus, Users } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";
import PageHeader from "../components/common/PageHeader";
import Input from "../components/common/Input";
import SelectInput from "../components/forms/SelectInput";
import userService from "../services/userService";
import useAuthStore from "../stores/authStore";
import { USER_ROLES } from "../utils/permissions";

const roleOptions = [
  { value: USER_ROLES.TEACHER, label: "Teacher" },
  { value: USER_ROLES.COORDINATOR, label: "SPED Coordinator" },
  { value: USER_ROLES.ADMIN, label: "Admin" },
];

const emptyUser = {
  fullName: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
  role: USER_ROLES.TEACHER,
};

const UserManagement = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState(emptyUser);
  const [errors, setErrors] = useState({});
  const [resetTarget, setResetTarget] = useState(null);
  const [resetData, setResetData] = useState({ password: "", confirm: "" });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      setUsers(await userService.list());
    } catch (error) {
      toast.error(error.message || "Could not load users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;
    userService
      .list()
      .then((records) => isCurrent && setUsers(records))
      .catch(
        (error) =>
          isCurrent && toast.error(error.message || "Could not load users"),
      )
      .finally(() => isCurrent && setIsLoading(false));
    return () => {
      isCurrent = false;
    };
  }, []);

  const closeCreate = () => {
    setIsCreateOpen(false);
    setDraft(emptyUser);
    setErrors({});
  };

  const createUser = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!draft.fullName.trim()) nextErrors.fullName = "Full name is required";
    if (!draft.username.trim()) nextErrors.username = "Username is required";
    if (draft.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }
    if (draft.password !== draft.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    try {
      await userService.create(draft);
      toast.success("User created");
      closeCreate();
      await loadUsers();
    } catch (error) {
      toast.error(error.message || "Could not create user");
    } finally {
      setIsSaving(false);
    }
  };

  const updateRole = async (userId, role) => {
    try {
      const updated = await userService.updateRole(userId, role);
      setUsers((current) =>
        current.map((user) => (user.id === updated.id ? updated : user)),
      );
      toast.success("Role updated");
    } catch (error) {
      toast.error(error.message || "Could not update role");
      await loadUsers();
    }
  };

  const toggleStatus = async (user) => {
    try {
      const updated = await userService.setActive(user.id, !user.isActive);
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(updated.isActive ? "User activated" : "User deactivated");
    } catch (error) {
      toast.error(error.message || "Could not update account status");
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (resetData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (resetData.password !== resetData.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setIsSaving(true);
    try {
      await userService.resetPassword(resetTarget.id, resetData.password);
      toast.success("Password reset");
      setResetTarget(null);
      setResetData({ password: "", confirm: "" });
    } catch (error) {
      toast.error(error.message || "Could not reset password");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="User Management"
        description="Create accounts and control access to this GURO installation."
        actions={
          <Button icon={UserPlus} onClick={() => setIsCreateOpen(true)}>
            Create User
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Total users" value={users.length} icon={Users} />
        <Summary
          label="Active users"
          value={users.filter((user) => user.isActive).length}
          icon={ShieldCheck}
        />
        <Summary
          label="Admins"
          value={users.filter((user) => user.role === USER_ROLES.ADMIN).length}
          icon={KeyRound}
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : users.length ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isCurrent = String(user.id) === String(currentUser?.id);
                  return (
                    <tr key={user.id}>
                      <td>
                        <p className="font-semibold">{user.fullName}</p>
                        <p className="text-xs text-base-content/55">
                          {user.email || "No email provided"}
                        </p>
                      </td>
                      <td>{user.username}</td>
                      <td className="min-w-48">
                        <SelectInput
                          value={user.role}
                          options={roleOptions}
                          disabled={isCurrent}
                          onChange={(role) => updateRole(user.id, role)}
                        />
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            user.isActive ? "badge-success" : "badge-ghost"
                          }`}
                        >
                          {user.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td>{formatUserDate(user.createdAt)}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setResetTarget(user)}
                          >
                            Reset Password
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isCurrent}
                            onClick={() => toggleStatus(user)}
                          >
                            {user.isActive ? "Disable" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-base-content/60">
            No users found.
          </p>
        )}
      </section>

      <Modal isOpen={isCreateOpen} onClose={closeCreate} title="Create User" size="lg">
        <UserForm
          data={draft}
          errors={errors}
          isSaving={isSaving}
          onChange={(field, value) => {
            setDraft((current) => ({ ...current, [field]: value }));
            setErrors((current) => ({ ...current, [field]: "" }));
          }}
          onCancel={closeCreate}
          onSubmit={createUser}
        />
      </Modal>

      <Modal
        isOpen={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title="Reset Password"
      >
        <form onSubmit={resetPassword} className="space-y-4">
          <p className="text-sm text-base-content/65">
            Set a new password for {resetTarget?.fullName}.
          </p>
          <Input
            label="New password"
            type="password"
            value={resetData.password}
            onChange={(event) =>
              setResetData((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            required
          />
          <Input
            label="Confirm password"
            type="password"
            value={resetData.confirm}
            onChange={(event) =>
              setResetData((current) => ({
                ...current,
                confirm: event.target.value,
              }))
            }
            required
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const UserForm = ({ data, errors, isSaving, onChange, onCancel, onSubmit }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Input label="Full name" value={data.fullName} onChange={(event) => onChange("fullName", event.target.value)} error={errors.fullName} required />
    <Input label="Email" type="email" value={data.email} onChange={(event) => onChange("email", event.target.value)} placeholder="Optional" />
    <Input label="Username" value={data.username} onChange={(event) => onChange("username", event.target.value)} error={errors.username} required />
    <SelectInput label="Role" value={data.role} onChange={(role) => onChange("role", role)} options={roleOptions} required />
    <Input label="Password" type="password" value={data.password} onChange={(event) => onChange("password", event.target.value)} error={errors.password} required />
    <Input label="Confirm password" type="password" value={data.confirmPassword} onChange={(event) => onChange("confirmPassword", event.target.value)} error={errors.confirmPassword} required />
    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      <Button type="submit" loading={isSaving}>Create User</Button>
    </div>
  </form>
);

const Summary = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-base-300 bg-base-100 p-4">
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5" />
      <div><p className="text-xs text-base-content/55">{label}</p><p className="text-xl font-bold">{value}</p></div>
    </div>
  </div>
);

const formatUserDate = (value) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value))
    : "Not recorded";

export default UserManagement;
