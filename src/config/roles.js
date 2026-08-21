export const ROLES = {
  ADMIN: 'admin',
  FINANCE: 'finance',
  INSTRUCTOR: 'instructor',
  ADMISSIONS: 'admissions',
  STUDENT: 'student',
};

export const ALL_ROLES = Object.values(ROLES);

export const STAFF_ROLES = [
  ROLES.ADMIN,
  ROLES.FINANCE,
  ROLES.INSTRUCTOR,
  ROLES.ADMISSIONS,
];
