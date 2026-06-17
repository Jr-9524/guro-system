export const studentCsvFields = [
  "lrn",
  "firstName",
  "middleName",
  "lastName",
  "birthDate",
  "gender",
  "gradeLevel",
  "section",
  "school",
  "primaryDisabilityCategory",
  "severityLevel",
  "communicationMode",
  "address",
  "guardianName",
  "guardianContact",
  "guardianEmail",
  "guardianRelationship",
];

const aliases = {
  lrn: "lrn",
  "first name": "firstName",
  firstname: "firstName",
  first_name: "firstName",
  "middle name": "middleName",
  middlename: "middleName",
  middle_name: "middleName",
  "last name": "lastName",
  lastname: "lastName",
  last_name: "lastName",
  "birth date": "birthDate",
  birthdate: "birthDate",
  birth_date: "birthDate",
  gender: "gender",
  "grade level": "gradeLevel",
  gradelevel: "gradeLevel",
  grade_level: "gradeLevel",
  grade: "gradeLevel",
  section: "section",
  school: "school",
  "primary disability category": "primaryDisabilityCategory",
  primarydisabilitycategory: "primaryDisabilityCategory",
  primary_disability_category: "primaryDisabilityCategory",
  disability: "primaryDisabilityCategory",
  "severity level": "severityLevel",
  severitylevel: "severityLevel",
  severity_level: "severityLevel",
  "communication mode": "communicationMode",
  communicationmode: "communicationMode",
  communication_mode: "communicationMode",
  address: "address",
  "guardian name": "guardianName",
  guardianname: "guardianName",
  guardian_name: "guardianName",
  "guardian contact": "guardianContact",
  guardiancontact: "guardianContact",
  guardian_contact: "guardianContact",
  "guardian email": "guardianEmail",
  guardianemail: "guardianEmail",
  guardian_email: "guardianEmail",
  "guardian relationship": "guardianRelationship",
  guardianrelationship: "guardianRelationship",
  guardian_relationship: "guardianRelationship",
};

const normalizeHeader = (header) =>
  aliases[String(header).trim().toLowerCase()] || null;

const escapeCsvValue = (value) => {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
};

export const studentsToCsv = (students) => {
  const rows = [
    studentCsvFields,
    ...students.map((student) =>
      studentCsvFields.map((field) => escapeCsvValue(student[field])),
    ),
  ];

  return rows.map((row) => row.join(",")).join("\n");
};

export const downloadStudentsCsv = (students, filename = "students.csv") => {
  const blob = new Blob([studentsToCsv(students)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const parseCsv = (csvText) => {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(current);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
};

export const parseStudentsCsv = (csvText) => {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return { students: [], errors: ["CSV needs a header row and at least one student row."] };
  }

  const mappedHeaders = rows[0].map(normalizeHeader);
  const students = [];
  const errors = [];

  rows.slice(1).forEach((row, rowIndex) => {
    const student = studentCsvFields.reduce(
      (record, field) => ({ ...record, [field]: "" }),
      {},
    );

    row.forEach((value, columnIndex) => {
      const field = mappedHeaders[columnIndex];
      if (field) student[field] = value.trim();
    });

    const lineNumber = rowIndex + 2;
    const rowErrors = validateImportedStudent(student);
    if (rowErrors.length) {
      errors.push(`Line ${lineNumber}: ${rowErrors.join(", ")}`);
    } else {
      students.push(student);
    }
  });

  return { students, errors };
};

export const validateImportedStudent = (student) => {
  const errors = [];

  if (!/^\d{12}$/.test(student.lrn)) errors.push("LRN must be 12 digits");
  if (!student.firstName.trim()) errors.push("first name is required");
  if (!student.lastName.trim()) errors.push("last name is required");
  if (!student.gradeLevel.trim()) errors.push("grade level is required");

  return errors;
};
