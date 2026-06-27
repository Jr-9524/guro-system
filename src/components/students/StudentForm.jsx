// src/components/students/StudentForm.jsx
import { useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  UserPlus,
} from "lucide-react";
import useStudentStore from "../../stores/studentStore";
import Button from "../common/Button";
import Input from "../common/Input";
import Panel from "../common/Panel";
import SelectInput from "../forms/SelectInput";
import CreatableSelectInput from "../forms/CreatableSelectInput";
import {
  communicationModes,
  disabilityCategories,
  gradeLevels,
} from "../../constants/formOptions";

const severityLevels = ["Mild", "Moderate", "Severe", "Profound"];

const buildInitialFormData = (student) => ({
  lrn: student?.lrn || "",
  firstName: student?.firstName || "",
  middleName: student?.middleName || "",
  lastName: student?.lastName || "",
  birthDate: student?.birthDate || "",
  gender: student?.gender || "Male",
  gradeLevel: student?.gradeLevel || "",
  section: student?.section || "",
  school: student?.school || "",
  primaryDisabilityCategory: student?.primaryDisabilityCategory || "",
  severityLevel: student?.severityLevel || "",
  communicationMode: student?.communicationMode || "",
  address: student?.address || "",
  guardianName: student?.guardianName || "",
  guardianContact: student?.guardianContact || "",
  guardianEmail: student?.guardianEmail || "",
  guardianRelationship: student?.guardianRelationship || "",
});

const StudentForm = ({ student, onSuccess, onCancel }) => {
  const { addStudent, updateStudent } = useStudentStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDetails, setShowDetails] = useState(Boolean(student));
  const [formData, setFormData] = useState(() => buildInitialFormData(student));

  const validate = () => {
    const newErrors = {};

    if (!/^\d{12}$/.test(formData.lrn)) {
      newErrors.lrn = "LRN must be exactly 12 digits";
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.gradeLevel) {
      newErrors.gradeLevel = "Grade level is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (student) {
        await updateStudent(student.id, formData);
      } else {
        await addStudent(formData);
      }
      onSuccess?.();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    const nextValue = field === "lrn" ? value.replace(/\D/g, "") : value;
    setFormData((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!student && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-content">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Create a student profile</h3>
              <p className="mt-1 text-sm text-base-content/70">
                Start with the required fields. Optional details can be added
                now or filled in later from the profile page.
              </p>
            </div>
          </div>
        </div>
      )}

      <Panel title={student ? "Student Information" : "Required Information"}>
        <p className="mb-4 text-sm text-base-content/60">
          {student
            ? "Review the core profile details."
            : "These fields are needed to add the student."}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="LRN"
            value={formData.lrn}
            onChange={(event) => handleChange("lrn", event.target.value)}
            error={errors.lrn}
            helperText="Enter exactly 12 digits."
            placeholder="12-digit LRN"
            maxLength={12}
            inputMode="numeric"
            required
          />

          <CreatableSelectInput
            label="Grade Level"
            value={formData.gradeLevel}
            onChange={(value) => handleChange("gradeLevel", value)}
            options={gradeLevels}
            placeholder="Select or type to add"
            helperText="Select an option or type a custom value."
            error={errors.gradeLevel}
            required
          />

          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(event) => handleChange("firstName", event.target.value)}
            error={errors.firstName}
            required
          />

          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(event) => handleChange("lastName", event.target.value)}
            error={errors.lastName}
            required
          />

          <Input
            label="Section"
            value={formData.section}
            onChange={(event) => handleChange("section", event.target.value)}
            placeholder="e.g., SPED A"
          />

          <Input
            label="Guardian Name"
            value={formData.guardianName}
            onChange={(event) =>
              handleChange("guardianName", event.target.value)
            }
            placeholder="Optional"
          />
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm mt-4 gap-2 px-2"
          onClick={() => setShowDetails((current) => !current)}
        >
          {showDetails ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {showDetails ? "Hide optional details" : "Add optional details"}
        </button>
      </Panel>

      {showDetails && (
        <div className="space-y-4">
          <Panel title="Student Details">
            <p className="mb-4 text-sm text-base-content/60">
              Personal and school information for the profile.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Middle Name"
                value={formData.middleName}
                onChange={(event) =>
                  handleChange("middleName", event.target.value)
                }
              />

              <Input
                label="Birth Date"
                type="date"
                value={formData.birthDate}
                onChange={(event) =>
                  handleChange("birthDate", event.target.value)
                }
              />

              <SelectInput
                label="Gender"
                value={formData.gender}
                onChange={(value) => handleChange("gender", value)}
                options={["Male", "Female", "Other"]}
              />

              <Input
                label="School"
                value={formData.school}
                onChange={(event) => handleChange("school", event.target.value)}
                placeholder="School or center"
              />

              <Input
                label="Address"
                value={formData.address}
                onChange={(event) =>
                  handleChange("address", event.target.value)
                }
                placeholder="Complete address"
                wrapperClassName="md:col-span-2"
              />
            </div>
          </Panel>

          <Panel title="Support Profile">
            <p className="mb-4 text-sm text-base-content/60">
              Learning support details used in reports and IEPs.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <CreatableSelectInput
                label="Primary Disability Category"
                value={formData.primaryDisabilityCategory}
                onChange={(value) =>
                  handleChange("primaryDisabilityCategory", value)
                }
                placeholder="Select or type to add"
                helperText="Select an option or type a custom value."
                options={disabilityCategories}
              />

              <SelectInput
                label="Severity Level"
                value={formData.severityLevel}
                onChange={(value) => handleChange("severityLevel", value)}
                placeholder="Select severity"
                options={severityLevels}
              />

              <CreatableSelectInput
                label="Communication Mode"
                value={formData.communicationMode}
                onChange={(value) => handleChange("communicationMode", value)}
                placeholder="Select or type to add"
                helperText="Select an option or type a custom value."
                options={communicationModes}
              />
            </div>
          </Panel>

          <Panel title="Guardian Information">
            <p className="mb-4 text-sm text-base-content/60">
              Contact details for the student's primary guardian.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Relationship"
                value={formData.guardianRelationship}
                onChange={(event) =>
                  handleChange("guardianRelationship", event.target.value)
                }
                placeholder="e.g., Mother, Father"
              />

              <Input
                label="Contact Number"
                value={formData.guardianContact}
                onChange={(event) =>
                  handleChange("guardianContact", event.target.value)
                }
                placeholder="+63..."
              />

              <Input
                label="Email"
                type="email"
                value={formData.guardianEmail}
                onChange={(event) =>
                  handleChange("guardianEmail", event.target.value)
                }
                placeholder="email@example.com"
              />
            </div>
          </Panel>
        </div>
      )}

      {errors.submit && (
        <div className="alert alert-error">
          <AlertCircle className="h-5 w-5" />
          <span>{errors.submit}</span>
        </div>
      )}

      <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-gray-200 bg-base-100 p-5 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          onClick={onCancel}
          type="button"
          className="bg-transparent hover:bg-base-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          className="border-primary bg-primary hover:bg-primary/90"
        >
          {student ? "Update Student" : "Add Student"}
        </Button>
      </div>
    </form>
  );
};

export default StudentForm;
