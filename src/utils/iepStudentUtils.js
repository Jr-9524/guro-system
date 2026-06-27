const emptyValue = "";

const valueFrom = (...values) =>
  values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  ) ?? emptyValue;

export const getAgeFromBirthDate = (birthDate) => {
  if (!birthDate) return emptyValue;

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return emptyValue;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const birthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());

  if (!birthdayPassed) age -= 1;
  return age >= 0 ? String(age) : emptyValue;
};

export const buildStudentSnapshot = (student) => {
  if (!student) return null;

  return {
    studentId: student.id ?? student.studentId ?? emptyValue,
    fullName: [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" "),
    firstName: student.firstName || emptyValue,
    middleName: student.middleName || emptyValue,
    lastName: student.lastName || emptyValue,
    gradeLevel: student.gradeLevel || emptyValue,
    age: valueFrom(student.age, getAgeFromBirthDate(student.birthDate)),
    school: student.school || emptyValue,
    disabilityCategory:
      student.primaryDisabilityCategory || student.disabilityCategory || emptyValue,
    learningNeeds: student.learningNeeds || emptyValue,
    communicationMode: student.communicationMode || emptyValue,
    supportIntensity:
      student.supportIntensity || student.severityLevel || emptyValue,
    developmentalLevel: student.developmentalLevel || emptyValue,
    guardianName: student.guardianName || emptyValue,
    guardianContact: student.guardianContact || emptyValue,
    guardianRelationship: student.guardianRelationship || emptyValue,
    guardianEmail: student.guardianEmail || emptyValue,
    capturedAt: new Date().toISOString(),
  };
};

const snapshotFromLegacyInfo = (info = {}) => ({
  studentId: info.studentId || emptyValue,
  fullName:
    info.fullName ||
    [info.firstName, info.middleName, info.lastName].filter(Boolean).join(" "),
  firstName: info.firstName || emptyValue,
  middleName: info.middleName || emptyValue,
  lastName: info.lastName || emptyValue,
  gradeLevel: info.gradeLevel || emptyValue,
  age: info.age || emptyValue,
  school: info.school || emptyValue,
  disabilityCategory:
    info.disabilityCategory || info.disability || emptyValue,
  learningNeeds: info.learningNeeds || emptyValue,
  communicationMode: info.communicationMode || emptyValue,
  supportIntensity:
    info.supportIntensity || info.disabilitySeverity || emptyValue,
  developmentalLevel: info.developmentalLevel || emptyValue,
  guardianName: info.guardianName || emptyValue,
  guardianContact: info.guardianContact || emptyValue,
  guardianRelationship: info.guardianRelationship || emptyValue,
  guardianEmail: info.guardianEmail || emptyValue,
  capturedAt: info.capturedAt || emptyValue,
});

const getData = (iepOrData) => iepOrData?.data || iepOrData || {};

export const getIepStudentSnapshot = (iepOrData, student) => {
  const data = getData(iepOrData);
  const current = buildStudentSnapshot(student);
  const saved = data.studentSnapshot || {};
  const legacy = snapshotFromLegacyInfo(data.studentInfo);

  return Object.fromEntries(
    Object.keys({ ...legacy, ...saved, ...(current || {}) }).map((key) => [
      key,
      valueFrom(current?.[key], saved[key], legacy[key]),
    ]),
  );
};

export const getStudentSummaryForIep = getIepStudentSnapshot;

export const getIepDates = (iepOrData) => {
  const data = getData(iepOrData);
  const details = data.iepDetails || {};
  const legacy = data.studentInfo || {};

  return {
    startDate: valueFrom(details.startDate, data.iepStartDate, legacy.iepStartDate),
    endDate: valueFrom(details.endDate, data.iepEndDate, legacy.iepEndDate),
    reviewDate: valueFrom(
      details.reviewDate,
      data.reviewDate,
      legacy.reviewDate,
      details.endDate,
      legacy.iepEndDate,
    ),
  };
};

export const normalizeIepStudentInfo = (iepData = {}, student) => {
  const dates = getIepDates(iepData);
  const existingSnapshot = iepData.studentSnapshot;

  return {
    ...iepData,
    iepDetails: {
      ...(iepData.iepDetails || {}),
      ...dates,
    },
    studentSnapshot: student
      ? buildStudentSnapshot(student)
      : existingSnapshot || snapshotFromLegacyInfo(iepData.studentInfo),
  };
};
