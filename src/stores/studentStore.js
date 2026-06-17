// src/stores/studentStore.js
import { create } from "zustand";
import studentService from "../services/studentService";
import auditService from "../services/auditService";
import toast from "react-hot-toast";

const useStudentStore = create((set, get) => ({
  students: [],
  selectedStudent: null,
  isLoading: false,
  searchQuery: "",
  filters: {
    gradeLevel: "all",
    status: "all",
  },

  fetchStudents: async () => {
    set({ isLoading: true });
    try {
      const students = await studentService.getAll();
      set({ students, isLoading: false });
    } catch {
      toast.error("Failed to load students");
      set({ students: [], isLoading: false });
    }
  },

  addStudent: async (studentData) => {
    try {
      const newStudent = await studentService.create(studentData);
      set((state) => ({
        students: [...state.students, newStudent],
      }));
      auditService.log({
        type: "student",
        title: "Student added",
        description: `${newStudent.firstName || ""} ${newStudent.lastName || ""}`.trim(),
        entity: "student",
        entityId: newStudent.id,
        href: `/students/${newStudent.id}`,
      });
      toast.success("Student added successfully");
      return newStudent;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  },

  updateStudent: async (id, studentData) => {
    try {
      const updated = await studentService.update(id, studentData);
      set((state) => ({
        students: state.students.map((s) => (s.id === id ? updated : s)),
        selectedStudent:
          state.selectedStudent?.id === id ? updated : state.selectedStudent,
      }));
      auditService.log({
        type: "student",
        title: "Student updated",
        description: `${updated.firstName || ""} ${updated.lastName || ""}`.trim(),
        entity: "student",
        entityId: updated.id,
        href: `/students/${updated.id}`,
      });
      toast.success("Student updated successfully");
      return updated;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  },

  deleteStudent: async (id) => {
    const student = get().students.find((item) => item.id === id);
    await studentService.delete(id);
    set((state) => ({
      students: state.students.filter((s) => s.id !== id),
      selectedStudent:
        state.selectedStudent?.id === id ? null : state.selectedStudent,
    }));
    auditService.log({
      type: "student",
      title: "Student deleted",
      description: student
        ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
        : id,
      entity: "student",
      entityId: id,
    });
    toast.success("Student deleted successfully");
  },

  selectStudent: (id) => {
    const student = get().students.find((s) => s.id === id);
    set({ selectedStudent: student });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  getFilteredStudents: () => {
    const { students, searchQuery, filters } = get();

    return students.filter((student) => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          student.firstName?.toLowerCase().includes(search) ||
          student.lastName?.toLowerCase().includes(search) ||
          student.lrn?.includes(search) ||
          student.gradeLevel?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Grade filter
      if (
        filters.gradeLevel !== "all" &&
        student.gradeLevel !== filters.gradeLevel
      ) {
        return false;
      }

      // Status filter
      if (filters.status === "active" && !student.isActive) return false;
      if (filters.status === "inactive" && student.isActive) return false;

      return true;
    });
  },
}));

export default useStudentStore;
