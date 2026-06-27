import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import LoadingSpinner from "../components/common/LoadingSpinner";
import userService from "../services/userService";
import useAuthStore from "../stores/authStore";

const emptySetupData = {
  fullName: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
};

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [userCount, setUserCount] = useState(null);
  const [setupError, setSetupError] = useState("");
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [setupData, setSetupData] = useState(emptySetupData);
  const [formErrors, setFormErrors] = useState({});

  const checkUserCount = useCallback(async () => {
    setSetupError("");
    setUserCount(null);
    try {
      setUserCount(await userService.getUserCount());
    } catch (countError) {
      setSetupError(
        countError.message || "Could not check whether GURO is configured.",
      );
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;
    userService
      .getUserCount()
      .then((count) => isCurrent && setUserCount(count))
      .catch(
        (countError) =>
          isCurrent &&
          setSetupError(
            countError.message || "Could not check whether GURO is configured.",
          ),
      );
    return () => {
      isCurrent = false;
    };
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    clearError();
    const errors = {
      username: !formData.username ? "Email or username is required" : "",
      password: !formData.password ? "Password is required" : "",
    };
    if (errors.username || errors.password) {
      setFormErrors(errors);
      return;
    }
    if (await login(formData.username, formData.password)) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
  };

  const handleCreateFirstAdmin = async (event) => {
    event.preventDefault();
    setSetupError("");
    const errors = {};
    if (!setupData.fullName.trim()) errors.fullName = "Full name is required";
    if (!setupData.username.trim()) errors.username = "Username is required";
    if (setupData.password.length < 8)
      errors.password = "Password must be at least 8 characters";
    if (setupData.password !== setupData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setIsCreatingAdmin(true);
    try {
      await userService.createFirstAdmin(setupData);
      toast.success("Administrator account created. Sign in to continue.");
      setFormData({ username: setupData.username, password: "" });
      setSetupData(emptySetupData);
      setFormErrors({});
      setUserCount(1);
    } catch (createError) {
      const message =
        createError.message || "Could not create the administrator account.";
      const count = await userService.getUserCount().catch(() => null);
      if (count && count > 0) setUserCount(count);
      else setSetupError(message);
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  if (userCount === null && !setupError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img
            src="/guro_logo.ico"
            alt="GURO logo"
            className="mx-auto mb-4 h-20 w-20 rounded-2xl object-contain shadow-sm"
          />
          <h1 className="text-3xl font-black tracking-[0.16em] text-base-content">
            GURO
          </h1>
          <p className="mt-2 text-sm text-base-content/60">
            IEP Management System
          </p>
        </div>
        <div className="card">
          {setupError && userCount === null ? (
            <div className="text-center">
              <h2 className="section-header">Setup check unavailable</h2>
              <p className="mt-2 text-sm text-base-content/65">{setupError}</p>
              <Button className="mt-5" onClick={checkUserCount}>
                Try Again
              </Button>
            </div>
          ) : userCount === 0 ? (
            <FirstAdminSetup
              data={setupData}
              errors={formErrors}
              error={setupError}
              isLoading={isCreatingAdmin}
              onChange={(field, value) => {
                setSetupData((current) => ({ ...current, [field]: value }));
                setFormErrors((current) => ({ ...current, [field]: "" }));
              }}
              onSubmit={handleCreateFirstAdmin}
            />
          ) : (
            <>
              <h2 className="section-header text-center">Sign In</h2>
              <h3 className="text-center mb-3">
                User: admin <br /> Pass: admin123 <br /> Nasa setting ng admin
                yung registration ng account for teachers
              </h3>

              {error && (
                <div className="mb-4 rounded-xl border border-error/25 bg-error/10 p-3">
                  <p className="text-sm">{error}</p>
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email or username"
                  value={formData.username}
                  onChange={(event) => {
                    setFormData((current) => ({
                      ...current,
                      username: event.target.value,
                    }));
                    setFormErrors((current) => ({ ...current, username: "" }));
                  }}
                  error={formErrors.username}
                  placeholder="Enter your email or username"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => {
                    setFormData((current) => ({
                      ...current,
                      password: event.target.value,
                    }));
                    setFormErrors((current) => ({ ...current, password: "" }));
                  }}
                  error={formErrors.password}
                  placeholder="Enter your password"
                  required
                />
                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full font-semibold"
                >
                  Sign In
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-base-content/60">
                Ask your administrator to create an account.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const FirstAdminSetup = ({
  data,
  errors,
  error,
  isLoading,
  onChange,
  onSubmit,
}) => (
  <>
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" />
      <div>
        <h2 className="font-bold">Create First Admin Account</h2>
        <p className="mt-1 text-sm leading-6 text-base-content/65">
          This setup appears only because no users exist yet. The first account
          will become the system administrator.
        </p>
      </div>
    </div>
    {error && (
      <div className="mb-4 rounded-xl border border-error/25 bg-error/10 p-3 text-sm">
        {error}
      </div>
    )}
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Full name"
        value={data.fullName}
        onChange={(event) => onChange("fullName", event.target.value)}
        error={errors.fullName}
        required
      />
      <Input
        label="Email"
        type="email"
        value={data.email}
        onChange={(event) => onChange("email", event.target.value)}
        error={errors.email}
        placeholder="Optional"
      />
      <Input
        label="Username"
        value={data.username}
        onChange={(event) => onChange("username", event.target.value)}
        error={errors.username}
        required
      />
      <Input
        label="Password"
        type="password"
        value={data.password}
        onChange={(event) => onChange("password", event.target.value)}
        error={errors.password}
        placeholder="At least 8 characters"
        required
      />
      <Input
        label="Confirm password"
        type="password"
        value={data.confirmPassword}
        onChange={(event) => onChange("confirmPassword", event.target.value)}
        error={errors.confirmPassword}
        required
      />
      <Button type="submit" loading={isLoading} className="w-full">
        Create Admin Account
      </Button>
    </form>
  </>
);

export default Login;
