// src/pages/StudentView.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Download,
  FileSpreadsheet,
  Grid3X3,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
  List,
  PersonStanding,
  NotebookText,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import useStudentStore from "../stores/studentStore";
import iepService from "../services/iepService";
import {
  downloadStudentsCsv,
  parseStudentsCsv,
  studentCsvFields,
  studentsToCsv,
} from "../services/studentCsvService";
import auditService from "../services/auditService";

import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Stat from "../components/common/Stat";
import StudentForm from "../components/students/StudentForm";
import SearchInput from "../components/common/SearchInput";

import { formatDate } from "../utils/dateUtils";
import { normalizeIep } from "../utils/iepUtils";
import { getStudentFullName, getStudentInitials } from "../utils/studentUtils";

const Views = {
  TABLE: "table",
  GALLERY: "gallery",
  CALENDAR: "calendar",
};

const gradeOptions = [
  "all",
  "K",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

const StudentsView = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    students,
    searchQuery,
    filters,
    fetchStudents,
    addStudent,
    deleteStudent,
    setSearchQuery,
    setFilter,
  } = useStudentStore();

  const currentView = useMemo(() => {
    const view = searchParams.get("view");
    if (view === Views.CALENDAR) return Views.CALENDAR;
    if (view === Views.GALLERY) return Views.GALLERY;
    return Views.TABLE;
  }, [searchParams]);
  const [sortBy, setSortBy] = useState("lastName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [studentIeps, setStudentIeps] = useState([]);
  const [calendarIeps, setCalendarIeps] = useState([]);
  const [isIepLoading, setIsIepLoading] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [isAddModalRequested, setIsAddModalRequested] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const isAddModalOpen =
    isAddModalRequested || searchParams.get("action") === "add";

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    let isCurrent = true;

    const loadCalendarIeps = async () => {
      setIsCalendarLoading(true);
      try {
        const records = await iepService.getAll();
        if (isCurrent) setCalendarIeps(records);
      } catch {
        if (isCurrent) setCalendarIeps([]);
      } finally {
        if (isCurrent) setIsCalendarLoading(false);
      }
    };

    loadCalendarIeps();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const loadStudentIeps = async () => {
      if (!id) {
        setStudentIeps([]);
        return;
      }

      setIsIepLoading(true);
      try {
        const records = window.electronAPI?.iep?.getAll
          ? await window.electronAPI.iep.getAll({ studentId: id })
          : JSON.parse(localStorage.getItem("ieps") || "[]").filter(
              (iep) => iep.studentId === id,
            );

        if (!isCurrent) return;

        setStudentIeps(
          records
            .map(normalizeIep)
            .sort(
              (a, b) =>
                new Date(b.lastModified || 0) - new Date(a.lastModified || 0),
            ),
        );
      } catch {
        if (isCurrent) setStudentIeps([]);
      } finally {
        if (isCurrent) setIsIepLoading(false);
      }
    };

    loadStudentIeps();

    return () => {
      isCurrent = false;
    };
  }, [id]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === id),
    [id, students],
  );

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = students.filter((student) => {
      const matchesSearch =
        !q ||
        student.firstName?.toLowerCase().includes(q) ||
        student.lastName?.toLowerCase().includes(q) ||
        student.lrn?.includes(q) ||
        student.gradeLevel?.toLowerCase().includes(q);

      const matchesGrade =
        filters.gradeLevel === "all" ||
        student.gradeLevel === filters.gradeLevel;
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && student.isActive) ||
        (filters.status === "inactive" && !student.isActive);

      return matchesSearch && matchesGrade && matchesStatus;
    });

    result.sort((a, b) => {
      const aVal = String(a[sortBy] || "");
      const bVal = String(b[sortBy] || "");
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal, undefined, { numeric: true })
        : bVal.localeCompare(aVal, undefined, { numeric: true });
    });

    return result;
  }, [
    students,
    searchQuery,
    filters.gradeLevel,
    filters.status,
    sortBy,
    sortOrder,
  ]);

  const stats = useMemo(
    () => ({
      total: students.length,
      active: students.filter((student) => student.isActive).length,
      withIep: new Set(calendarIeps.map((iep) => iep.studentId)).size,
    }),
    [calendarIeps, students],
  );

  const closeAddModal = () => {
    setIsAddModalRequested(false);
    if (searchParams.get("action") === "add") {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("action");
      setSearchParams(nextParams);
    }
  };

  const changeView = (view) => {
    const nextParams = new URLSearchParams(searchParams);
    if (view === Views.TABLE) {
      nextParams.delete("view");
    } else {
      nextParams.set("view", view);
    }
    setSearchParams(nextParams);
  };

  const handleDelete = (student) => {
    deleteStudent(student.id);
    setDeleteConfirm(null);
    if (id === student.id) navigate("/students");
  };

  const handleExport = () => {
    if (!filteredAndSorted.length) {
      toast.error("No students to export.");
      return;
    }

    downloadStudentsCsv(filteredAndSorted, "guro-students.csv");
    auditService.log({
      type: "data",
      title: "Student CSV exported",
      description: `${filteredAndSorted.length} student records exported`,
      entity: "students",
      href: "/students",
    });
    toast.success(`${filteredAndSorted.length} student records exported.`);
  };

  const handleImportStudents = async (importStudents) => {
    for (const student of importStudents) {
      await addStudent(student);
    }

    setIsImportModalOpen(false);
    auditService.log({
      type: "data",
      title: "Student CSV imported",
      description: `${importStudents.length} student records imported`,
      entity: "students",
      href: "/students",
    });
    toast.success(`${importStudents.length} student records imported.`);
  };

  if (id) {
    if (!selectedStudent) {
      return (
        <div className="flex min-h-[24rem] flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-base-200 p-4">
            <User className="h-8 w-8 opacity-60" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Student not found</h1>
            <p className="mt-1 text-base-content/60">
              This profile may have been deleted or moved.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/students")}
            icon={ArrowLeft}
          >
            Back to Students
          </Button>
        </div>
      );
    }

    return (
      <div className="flex min-h-full w-full flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button onClick={() => navigate("/students")} icon={ArrowLeft}>
            Students
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setEditingStudent(selectedStudent)}
              icon={Pencil}
              className="border border-gray-300 p-2"
            >
              Edit
            </Button>
            <Button
              onClick={() => setDeleteConfirm(selectedStudent)}
              icon={Trash2}
              className="border border-gray-300 p-2"
            >
              Delete
            </Button>
          </div>
        </div>

        <section className="rounded-lg border border-gray-300 bg-base-100 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-content">
                {getStudentInitials(selectedStudent)}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold">
                  {getStudentFullName(selectedStudent)}
                </h1>
                <p className="mt-1 text-base-content/60">
                  Grade {selectedStudent.gradeLevel || "Not set"}
                  {selectedStudent.section
                    ? ` • ${selectedStudent.section}`
                    : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="badge badge-outline font-mono">
                    LRN {selectedStudent.lrn || "Not set"}
                  </span>
                  <span
                    className={`badge ${
                      selectedStudent.isActive ? "badge-success" : "badge-ghost"
                    }`}
                  >
                    {selectedStudent.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="badge badge-outline">No IEP</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid flex-1 grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-3">
            <section className="self-start rounded-lg border border-gray-300 bg-base-100 p-5">
              <h2 className="mb-2 text-base font-semibold">
                Student Information
              </h2>
              <div className="grid gap-x-3 gap-y-2 md:grid-cols-2 xl:grid-cols-3">
                <Info
                  label="Birth Date"
                  value={formatDate(selectedStudent.birthDate)}
                />
                <Info
                  label="Gender"
                  value={selectedStudent.gender || "Not set"}
                />
                <Info
                  label="Grade Level"
                  value={selectedStudent.gradeLevel || "Not set"}
                />
                <Info
                  label="Section"
                  value={selectedStudent.section || "Not set"}
                />
                <Info
                  label="School"
                  value={selectedStudent.school || "Not set"}
                />
                <Info
                  label="Created"
                  value={formatDate(selectedStudent.createdAt)}
                />
                <Info
                  label="Updated"
                  value={formatDate(selectedStudent.updatedAt)}
                />
                <Info
                  label="Address"
                  value={selectedStudent.address || "Not set"}
                />
              </div>
            </section>

            <IepHistoryPanel
              ieps={studentIeps}
              isLoading={isIepLoading}
              onCreate={() =>
                navigate(`/iep/new?studentId=${selectedStudent.id}`)
              }
              onOpen={(iep) => navigate(`/iep/${iep.id}`)}
            />
          </div>

          <aside className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            <section className="rounded-lg border border-gray-300 bg-base-100 p-5">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-base font-semibold">Support Profile</h2>
              </div>
              <div className="space-y-3">
                <Info
                  label="Primary Disability"
                  value={selectedStudent.primaryDisabilityCategory || "Not set"}
                />
                <Info
                  label="Severity Level"
                  value={selectedStudent.severityLevel || "Not set"}
                />
                <Info
                  label="Communication Mode"
                  value={selectedStudent.communicationMode || "Not set"}
                />
              </div>
            </section>

            <section className="rounded-lg border border-gray-300 bg-base-100 p-5">
              <h2 className="mb-3 text-base font-semibold">Guardian</h2>
              <div className="space-y-3">
                <Info
                  label="Name"
                  value={selectedStudent.guardianName || "Not set"}
                />
                <Info
                  label="Relationship"
                  value={selectedStudent.guardianRelationship || "Not set"}
                />
                <Contact icon={Phone} value={selectedStudent.guardianContact} />
                <Contact icon={Mail} value={selectedStudent.guardianEmail} />
              </div>
            </section>

            {/* <section className="rounded-lg border border-base-300 bg-base-100 p-4">
              <h2 className=" text-base font-semibold">IEP Status</h2>

              <Button
                className="mt-3 w-full border border-gray-300"
                onClick={() =>
                  navigate(`/iep/new?studentId=${selectedStudent.id}`)
                }
                icon={Plus}
              >
                Create IEP
              </Button>
            </section> */}
          </aside>
        </div>

        <StudentModals
          editingStudent={editingStudent}
          setEditingStudent={setEditingStudent}
          deleteConfirm={deleteConfirm}
          setDeleteConfirm={setDeleteConfirm}
          onDelete={handleDelete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-full w-full space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid w-full grid-cols-3 gap-3">
          <Stat
            label="Total"
            value={stats.total}
            className="border"
            icon={PersonStanding}
          />
          <Stat
            label="Active"
            value={stats.active}
            className="border"
            icon={Check}
          />
          <Stat
            label="With IEP"
            value={stats.withIep}
            className="border"
            icon={NotebookText}
          />
        </div>
      </div>

      <div className="border-gray-300 space-y-4">
        {/* Top row */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Students</h2>
            <p className="text-sm text-base-content/60">
              Manage student profiles and IEP records
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleExport}
              icon={Download}
              className="border border-gray-300 p-1.5"
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              icon={Upload}
              className="border border-gray-300 p-1.5"
            >
              Import CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAddModalRequested(true)}
              icon={Plus}
              className="border border-gray-300 p-1.5"
            >
              Quick Add Student
            </Button>
          </div>
        </div>

        {/* Search + View */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between ">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search students..."
          />

          <div className="flex items-center gap-4 rounded-lg border border-gray-300 p-1.5">
            <ViewButton
              active={currentView === Views.TABLE}
              icon={List}
              label="Table"
              onClick={() => changeView(Views.TABLE)}
            />

            <ViewButton
              active={currentView === Views.GALLERY}
              icon={Grid3X3}
              label="Gallery"
              onClick={() => changeView(Views.GALLERY)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            className="select border border-gray-300 cursor-pointer p-1.5"
            value={`${sortBy}:${sortOrder}`}
            onChange={(event) => {
              const [nextSortBy, nextSortOrder] = event.target.value.split(":");

              setSortBy(nextSortBy);
              setSortOrder(nextSortOrder);
            }}
          >
            <option value="lastName:asc">Name A-Z</option>
            <option value="lastName:desc">Name Z-A</option>
            <option value="gradeLevel:asc">Grade ascending</option>
            <option value="createdAt:desc">Newest first</option>
          </select>

          <select
            className="select border border-gray-300 cursor-pointer p-1.5"
            value={filters.gradeLevel}
            onChange={(event) => setFilter("gradeLevel", event.target.value)}
          >
            {gradeOptions.map((grade) => (
              <option key={grade} value={grade}>
                {grade === "all" ? "All grades" : `Grade ${grade}`}
              </option>
            ))}
          </select>

          <select
            className="select border border-gray-300 cursor-pointer p-1.5"
            value={filters.status}
            onChange={(event) => setFilter("status", event.target.value)}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-gray-300 bg-base-100">
        {currentView === Views.CALENDAR ? (
          <StudentCalendar
            students={filteredAndSorted}
            ieps={calendarIeps}
            isLoading={isCalendarLoading}
            month={calendarMonth}
            setMonth={setCalendarMonth}
            onOpenStudent={(studentId) => navigate(`/students/${studentId}`)}
            onOpenIep={(iepId) => navigate(`/iep/${iepId}/edit`)}
          />
        ) : filteredAndSorted.length > 0 ? (
          <>
            {currentView === Views.TABLE && (
              <StudentTable
                students={filteredAndSorted}
                onOpen={(student) => navigate(`/students/${student.id}`)}
                onEdit={setEditingStudent}
                onDelete={setDeleteConfirm}
              />
            )}

            {currentView === Views.GALLERY && (
              <StudentGallery
                students={filteredAndSorted}
                onOpen={(student) => navigate(`/students/${student.id}`)}
              />
            )}
          </>
        ) : (
          <EmptyState onAdd={() => setIsAddModalRequested(true)} />
        )}
      </section>

      <Modal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        title="Quick Add Student"
        size="2xl"
      >
        <StudentForm onSuccess={closeAddModal} onCancel={closeAddModal} />
      </Modal>

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Students"
        size="2xl"
      >
        <StudentImportTool
          existingStudents={students}
          onImport={handleImportStudents}
          onCancel={() => setIsImportModalOpen(false)}
        />
      </Modal>

      <StudentModals
        editingStudent={editingStudent}
        setEditingStudent={setEditingStudent}
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        onDelete={handleDelete}
      />
    </div>
  );
};

const StudentImportTool = ({ existingStudents, onImport, onCancel }) => {
  const [parsedStudents, setParsedStudents] = useState([]);
  const [errors, setErrors] = useState([]);
  const [fileName, setFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const existingLrns = useMemo(
    () =>
      new Set(existingStudents.map((student) => student.lrn).filter(Boolean)),
    [existingStudents],
  );

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const csvText = await file.text();
    const result = parseStudentsCsv(csvText);
    const seenLrns = new Set();
    const duplicateErrors = [];
    const importableStudents = result.students.filter((student, index) => {
      const lineNumber = index + 2;
      if (existingLrns.has(student.lrn)) {
        duplicateErrors.push(`Line ${lineNumber}: LRN already exists`);
        return false;
      }
      if (seenLrns.has(student.lrn)) {
        duplicateErrors.push(`Line ${lineNumber}: duplicate LRN in file`);
        return false;
      }
      seenLrns.add(student.lrn);
      return true;
    });

    setParsedStudents(importableStudents);
    setErrors([...result.errors, ...duplicateErrors]);
  };

  const downloadTemplate = () => {
    const sampleStudent = {
      lrn: "123456789012",
      firstName: "Juan",
      middleName: "",
      lastName: "Dela Cruz",
      birthDate: "2014-06-15",
      gender: "Male",
      gradeLevel: "4",
      section: "SPED A",
      school: "Sample Elementary School",
      primaryDisabilityCategory: "Learning Disability",
      severityLevel: "Mild",
      communicationMode: "Verbal",
      address: "Sample address",
      guardianName: "Maria Dela Cruz",
      guardianContact: "+639001234567",
      guardianEmail: "guardian@example.com",
      guardianRelationship: "Mother",
    };

    const blob = new Blob([studentsToCsv([sampleStudent])], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importStudents = async () => {
    if (!parsedStudents.length) return;

    setIsImporting(true);
    try {
      await onImport(parsedStudents);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-300 bg-base-100 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">Upload a student CSV</p>
            <p className="mt-1 text-sm text-base-content/60">
              Required columns are LRN, first name, last name, and grade level.
            </p>
          </div>
          <Button size="sm" onClick={downloadTemplate} icon={Download}>
            Template
          </Button>
        </div>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 p-6 text-center transition-colors hover:bg-base-200">
          <FileSpreadsheet className="h-8 w-8 opacity-60" />
          <span className="text-sm font-medium">
            {fileName || "Choose CSV file"}
          </span>
          <span className="text-xs text-base-content/60">
            Accepted headers: {studentCsvFields.slice(0, 4).join(", ")}...
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-error/30 bg-error/10 p-4">
          <p className="font-semibold text-error">
            {errors.length} row issue{errors.length === 1 ? "" : "s"} found
          </p>
          <div className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm text-base-content/70">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        </div>
      )}

      {parsedStudents.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-gray-300">
          <div className="border-b border-gray-300 bg-base-200 px-4 py-3 text-sm font-semibold">
            Preview: {parsedStudents.length} student
            {parsedStudents.length === 1 ? "" : "s"} ready to import
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>LRN</th>
                  <th>Grade</th>
                  <th>Guardian</th>
                </tr>
              </thead>
              <tbody>
                {parsedStudents.slice(0, 20).map((student) => (
                  <tr key={student.lrn}>
                    <td>{getStudentFullName(student)}</td>
                    <td className="font-mono">{student.lrn}</td>
                    <td>{student.gradeLevel}</td>
                    <td>{student.guardianName || "Not set"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedStudents.length > 20 && (
              <p className="border-t border-gray-300 p-3 text-sm text-base-content/60">
                Showing first 20 rows only.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-base-content/60">
          No importable rows loaded yet.
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={importStudents}
          loading={isImporting}
          disabled={!parsedStudents.length}
          icon={Upload}
        >
          Import Students
        </Button>
      </div>
    </div>
  );
};

const IepHistoryPanel = ({ ieps, isLoading, onCreate, onOpen }) => (
  <section className="rounded-lg border border-gray-300 bg-base-100 p-5">
    <div className="mb-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">IEP History</h2>
      </div>
      <Button size="sm" onClick={onCreate} icon={Plus}>
        New IEP
      </Button>
    </div>

    {isLoading ? (
      <div className="rounded-lg border border-dashed border-gray-300 p-3 text-sm text-base-content/60">
        Loading IEP records...
      </div>
    ) : ieps.length > 0 ? (
      <div className="divide-y divide-gray-300 rounded-lg border border-gray-300">
        {ieps.slice(0, 4).map((iep) => (
          <button
            key={iep.id}
            className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-base-200"
            onClick={() => onOpen(iep)}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{iep.title}</p>
              <p className="mt-1 text-xs text-base-content/60">
                Modified {formatDate(iep.lastModified)}
                {iep.completedSections.length > 0
                  ? ` · ${iep.completedSections.length}/6 sections`
                  : ""}
              </p>
            </div>
            <span
              className={`badge badge-sm shrink-0 ${
                iep.status === "complete" ? "badge-success" : "badge-warning"
              }`}
            >
              {iep.status}
            </span>
          </button>
        ))}
      </div>
    ) : (
      <div className="rounded-lg border border-dashed border-gray-300 p-3">
        <p className="text-sm font-medium">No IEP records yet</p>
        <p className="mt-1 text-xs text-base-content/60">
          Create the first plan for this student to begin tracking history.
        </p>
      </div>
    )}
  </section>
);

const StudentCalendar = ({
  students,
  ieps,
  isLoading,
  month,
  setMonth,
  onOpenStudent,
  onOpenIep,
}) => {
  const monthStart = useMemo(
    () => new Date(month.getFullYear(), month.getMonth(), 1),
    [month],
  );
  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(monthStart);
  const events = useMemo(
    () => buildCalendarEvents(students, ieps, monthStart),
    [students, ieps, monthStart],
  );
  const eventsByDate = useMemo(
    () =>
      events.reduce((groups, event) => {
        groups[event.dateKey] = [...(groups[event.dateKey] || []), event];
        return groups;
      }, {}),
    [events],
  );
  const days = useMemo(() => getCalendarDays(monthStart), [monthStart]);

  const shiftMonth = (amount) => {
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  };

  const openEvent = (event) => {
    if (event.iepId) onOpenIep(event.iepId);
    if (event.studentId && !event.iepId) onOpenStudent(event.studentId);
  };

  return (
    <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{monthLabel}</h3>
            <p className="text-sm text-base-content/60">
              Birthdays, IEP dates, and upcoming reviews
            </p>
          </div>
          <div className="join">
            <button
              className="btn join-item btn-sm"
              onClick={() => shiftMonth(-1)}
            >
              Previous
            </button>
            <button
              className="btn join-item btn-sm"
              onClick={() => setMonth(new Date())}
            >
              Today
            </button>
            <button
              className="btn join-item btn-sm"
              onClick={() => shiftMonth(1)}
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-l border-gray-300 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="border-r border-t border-gray-300 p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-l border-gray-300">
          {days.map((day) => {
            const dayEvents = eventsByDate[toDateKey(day)] || [];
            const isCurrentMonth = day.getMonth() === monthStart.getMonth();
            const isToday = toDateKey(day) === toDateKey(new Date());

            return (
              <div
                key={toDateKey(day)}
                className={`min-h-28 border-b border-r border-gray-300 p-2 ${
                  isCurrentMonth ? "bg-base-100" : "bg-base-200/50"
                }`}
              >
                <div
                  className={`mb-2 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday ? "bg-primary text-primary-content" : ""
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      className={`block w-full truncate rounded px-2 py-1 text-left text-xs ${event.color}`}
                      onClick={() => openEvent(event)}
                      title={event.title}
                    >
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="block text-xs text-base-content/50">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="rounded-lg border border-gray-300 bg-base-100 p-4">
        <h3 className="mb-3 text-base font-semibold">This Month</h3>
        {isLoading ? (
          <div className="py-8 text-center">
            <span className="loading loading-spinner"></span>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-2">
            {events.map((event) => (
              <button
                key={event.id}
                className="w-full rounded-lg border border-gray-300 p-3 text-left transition-colors hover:bg-base-200"
                onClick={() => openEvent(event)}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  {formatDate(event.date)}
                </div>
                <div className="mt-1 text-sm font-medium">{event.title}</div>
                <div className="mt-1 text-xs text-base-content/60">
                  {event.subtitle}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-base-content/60">
            No calendar items for this month.
          </div>
        )}
      </aside>
    </div>
  );
};

const getCalendarDays = (monthStart) => {
  const start = new Date(monthStart);
  start.setDate(1 - start.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const buildCalendarEvents = (students, ieps, monthStart) => {
  const month = monthStart.getMonth();
  const year = monthStart.getFullYear();
  const events = [];

  students.forEach((student) => {
    if (!student.birthDate) return;
    const birthDate = new Date(student.birthDate);
    if (Number.isNaN(birthDate.getTime())) return;

    const eventDate = new Date(year, birthDate.getMonth(), birthDate.getDate());
    if (eventDate.getMonth() !== month) return;

    events.push({
      id: `birthday-${student.id}`,
      title: `${getStudentFullName(student)} birthday`,
      subtitle: "Student birthday",
      date: eventDate,
      dateKey: toDateKey(eventDate),
      studentId: student.id,
      color: "bg-info/15 text-info",
    });
  });

  ieps.forEach((iep) => {
    const info = iep.data?.studentInfo || {};
    const name = [info.firstName, info.lastName].filter(Boolean).join(" ");

    addIepEvent(events, {
      iep,
      dateValue: info.iepStartDate,
      title: `${name || iep.title} IEP starts`,
      subtitle: iep.title,
      color: "bg-success/15 text-success",
      month,
    });
    addIepEvent(events, {
      iep,
      dateValue: info.iepEndDate,
      title: `${name || iep.title} IEP ends`,
      subtitle: "Annual review due",
      color: "bg-warning/20 text-warning",
      month,
    });

    if (info.iepEndDate) {
      const reviewDate = new Date(info.iepEndDate);
      if (!Number.isNaN(reviewDate.getTime())) {
        reviewDate.setDate(reviewDate.getDate() - 30);
        addIepEvent(events, {
          iep,
          dateValue: reviewDate,
          title: `${name || iep.title} review prep`,
          subtitle: "30 days before IEP end date",
          color: "bg-primary/10 text-primary",
          month,
        });
      }
    }
  });

  return events.sort(
    (a, b) => a.date - b.date || a.title.localeCompare(b.title),
  );
};

const addIepEvent = (
  events,
  { iep, dateValue, title, subtitle, color, month },
) => {
  if (!dateValue) return;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime()) || date.getMonth() !== month) return;

  events.push({
    id: `${iep.id}-${title}-${toDateKey(date)}`,
    title,
    subtitle,
    date,
    dateKey: toDateKey(date),
    iepId: iep.id,
    color,
  });
};

const ViewButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    className={`join-item btn btn-sm gap-2 ${active ? "btn-active" : ""}`}
    onClick={onClick}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

const Info = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
      {label}
    </p>
    <p className="mt-1 break-words text-sm font-medium">{value}</p>
  </div>
);

const Contact = ({ icon: Icon, value }) => (
  <div className="flex items-center gap-2 text-sm">
    <Icon className="h-4 w-4 text-base-content/50" />
    <span className="break-all">{value || "Not set"}</span>
  </div>
);

const StudentTable = ({ students, onOpen, onEdit, onDelete }) => (
  <div className="overflow-x-auto">
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>LRN</th>
          <th>Grade</th>
          <th>Guardian</th>
          <th>Status</th>
          <th>IEP</th>
          <th className="w-12"></th>
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr
            key={student.id}
            className="hover cursor-pointer"
            onClick={() => onOpen(student)}
          >
            <td>
              <div className="flex min-w-56 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-content">
                  {getStudentInitials(student)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {getStudentFullName(student)}
                  </p>
                  <p className="truncate text-xs text-base-content/60">
                    {student.section || "No section"}
                  </p>
                </div>
              </div>
            </td>
            <td className="font-mono text-sm">{student.lrn || "Not set"}</td>
            <td>
              <span className="badge badge-ghost badge-sm">
                Grade {student.gradeLevel || "?"}
              </span>
            </td>
            <td>{student.guardianName || "Not set"}</td>
            <td>
              <StatusBadge active={student.isActive} />
            </td>
            <td>
              <span className="badge badge-outline badge-sm">No IEP</span>
            </td>
            <td onClick={(event) => event.stopPropagation()}>
              <div className="dropdown dropdown-end">
                <button className="btn btn-ghost btn-xs btn-square">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <ul className="dropdown-content menu z-[1] w-40 rounded-box bg-base-100 p-2 shadow">
                  <li>
                    <button onClick={() => onEdit(student)}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onDelete(student)}
                      className="text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </li>
                </ul>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StudentGallery = ({ students, onOpen }) => (
  <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
    {students.map((student) => (
      <button
        key={student.id}
        className="rounded-lg border border-gray-300 bg-base-100 p-5 text-left transition-shadow hover:shadow-sm"
        onClick={() => onOpen(student)}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-content">
            {getStudentInitials(student)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-bold">
              {getStudentFullName(student)}
            </h3>
            <p className="mt-1 text-sm text-base-content/60">
              Grade {student.gradeLevel || "?"}
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Info label="LRN" value={student.lrn || "Not set"} />
          <Info label="Section" value={student.section || "Not set"} />
        </div>
      </button>
    ))}
  </div>
);

const StatusBadge = ({ active }) =>
  active ? (
    <span className="badge badge-success badge-sm gap-1">
      <Check className="h-3 w-3" />
      Active
    </span>
  ) : (
    <span className="badge badge-ghost badge-sm">Inactive</span>
  );

const EmptyState = ({ onAdd }) => (
  <div className="flex min-h-[24rem] flex-col items-center justify-center gap-4 p-8 text-center">
    <div className="rounded-full bg-base-200 p-4">
      <CalendarDays className="h-8 w-8 opacity-60" />
    </div>
    <div>
      <h2 className="text-lg font-bold">No students found</h2>
      <p className="mt-1 text-base-content/60">
        Adjust your search or create a new student profile.
      </p>
    </div>
    <Button onClick={onAdd} icon={Plus}>
      New Student
    </Button>
  </div>
);

const StudentModals = ({
  editingStudent,
  setEditingStudent,
  deleteConfirm,
  setDeleteConfirm,
  onDelete,
}) => (
  <>
    <Modal
      isOpen={!!editingStudent}
      onClose={() => setEditingStudent(null)}
      title="Edit Student"
      size="2xl"
    >
      <StudentForm
        student={editingStudent}
        onSuccess={() => setEditingStudent(null)}
        onCancel={() => setEditingStudent(null)}
      />
    </Modal>

    <Modal
      isOpen={!!deleteConfirm}
      onClose={() => setDeleteConfirm(null)}
      title="Delete Student"
      size="sm"
    >
      <p className="mb-4">
        Delete <strong>{getStudentFullName(deleteConfirm)}</strong>? This cannot
        be undone.
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
          Cancel
        </Button>
        <Button variant="danger" onClick={() => onDelete(deleteConfirm)}>
          Delete
        </Button>
      </div>
    </Modal>
  </>
);

export default StudentsView;
