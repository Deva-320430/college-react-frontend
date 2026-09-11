import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, ArrowRight, BookOpen, BookMarked, CalendarDays, Check, ChevronDown, ChevronUp, Eye, EyeOff, FolderOpen, GraduationCap, Landmark, Layers, Menu, Pencil, Plus, Save, Search, ShieldCheck, Trash2, Upload, UserCircle, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type User = {
  id: string;
  collegeId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

// after
type UserListItem = {
  id: string;
  collegeId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  phoneNumber: string | null;
  dob: string | null;
  joiningDate: string | null;
  profilePhoto: string | null;
  documentUrls: string[];
  gender: string | null;       // NEW
  religion: string | null;     // NEW
  maritalStatus: string | null; // NEW
  partnerName: string | null;   // NEW
  partnerOccupation: string | null; // NEW
  address: string | null;      // NEW
  salary: number | null;       // NEW
  yearsOfExperience: number | null;
  department: string | null;   // NEW
  course: string | null;       // NEW
  regulation: string | null;   // NEW
  departmentId: string | null; // NEW — raw ids for the edit form
  courseId: string | null;
  regulationId: string | null;
  rollNumber: string | null;            // NEW — Student
  fatherName: string | null;            // NEW — Student
  motherName: string | null;            // NEW — Student
  guardianName: string | null;          // NEW — Student
  fatherOccupation: string | null;      // NEW — Student
  motherOccupation: string | null;      // NEW — Student
  guardianOccupation: string | null;    // NEW — Student
  identificationMark1: string | null;   // NEW — Student
  identificationMark2: string | null;   // NEW — Student
  isRegular: boolean | null;            // NEW — Student
};

type DepartmentItem = { id: string; code: string; name: string };
type CourseItem = { id: string; code: string; name: string; duration: number; departments: DepartmentItem[] };
type RegulationItem = { id: string; name: string; subjectCount: number; departments: number };
type SyllabusSubject = {
  id: string;
  year: string;
  semester: string;
  code: string;
  name: string;
  credits: number;
  departmentId: string;
  department: { id: string; code: string; name: string };
  regulation: { id: string; name: string };
  courseId?: string | null;
  course?: { id: string; code: string; name: string } | null;
};
type FeeCategoryItem = { id: string; name: string };
type FeeStudentItem = {
  id: string;
  rollNumber: string;
  studentId: string;
  name: string;
  collegeId: string;
  department: string | null;
};
type FeeItem = {
  id: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  category: { id: string; name: string } | null;
  student?: { id: string; rollNumber: string; user: { firstName: string; lastName: string; collegeId: string } };
};

const amountFmt = (n: number): string => `$${n.toLocaleString('en-US')}`;

const roleTitles: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin Dashboard',
  ADMIN: 'Admin Dashboard',
  CHAIRMAN: 'Chairman Dashboard',
  EXAM_CELL: 'Exam Cell Dashboard',
  TEACHER: 'Teacher Dashboard',
  STUDENT: 'Student Dashboard',
  ACCOUNTANT: 'Accountant Dashboard',
};

const roleStats: Record<string, { label: string; value: string }[]> = {
  SUPER_ADMIN: [
    { label: 'Departments', value: '42' },
    { label: 'Faculty', value: '180' },
    { label: 'Students', value: '12K+' },
  ],
  ADMIN: [
    { label: 'Enrollments', value: '2.4K' },
    { label: 'Fee Collection', value: '92%' },
    { label: 'Pending Forms', value: '18' },
  ],
  CHAIRMAN: [
    { label: 'Reports', value: '24' },
    { label: 'Approvals', value: '7' },
    { label: 'Performance', value: '96%' },
  ],
  EXAM_CELL: [
    { label: 'Exams', value: '14' },
    { label: 'Results', value: '98%' },
    { label: 'Rechecks', value: '11' },
  ],
  TEACHER: [
    { label: 'Subjects', value: '6' },
    { label: 'Classes', value: '12' },
    { label: 'Attendance', value: '94%' },
  ],
  STUDENT: [
    { label: 'Courses', value: '7' },
    { label: 'Attendance', value: '91%' },
    { label: 'Results', value: 'A+' },
  ],
  ACCOUNTANT: [
    { label: 'Total Fees', value: '₹4.2L' },
    { label: 'Pending', value: '₹82K' },
    { label: 'Collected', value: '93%' },
  ],
};

function App() {
  const [collegeId, setCollegeId] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false); // NEW
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleGroups, setRoleGroups] = useState<Record<string, UserListItem[]>>({});
  const [usersRoleFilter, setUsersRoleFilter] = useState('ALL'); // 'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'CHAIRMAN' | 'EXAM_CELL' | 'TEACHER' | 'STUDENT' | 'ACCOUNTANT'
  // const [createUserForm, setCreateUserForm] = useState({
  //   username: '',
  //   collegeId: '',
  //   email: '',
  //   firstName: '',
  //   lastName: '',
  //   password: '',
  //   role: '',
  // });
  const [createUserForm, setCreateUserForm] = useState({
  username: '', collegeId: '', email: '', firstName: '', lastName: '', password: '',
  role: 'Select a Role',
  dob: '', joiningDate: '', yearsOfExperience: '', phoneNumber: '', // NEW
  gender: '', religion: '', // NEW
  maritalStatus: '', partnerName: '', partnerOccupation: '', // NEW
  departmentId: '', courseId: '', regulationId: '', // NEW
  address: '', salary: '', // NEW
  rollNumber: '', fatherName: '', motherName: '', guardianName: '', fatherOccupation: '', motherOccupation: '', guardianOccupation: '', identificationMark1: '', identificationMark2: '', isRegular: '', // NEW — Student
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null); // NEW
  const [teacherDocuments, setTeacherDocuments] = useState<File[]>([]);        // NEW
  const [fileInputResetKey, setFileInputResetKey] = useState(0); // NEW
  const [createUserError, setCreateUserError] = useState('');
  const [createUserSuccess, setCreateUserSuccess] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({
  id: '', username: '', collegeId: '', email: '', firstName: '', lastName: '', role: '', isActive: true,
  phoneNumber: '', dob: '', joiningDate: '', gender: '', religion: '', address: '', // NEW
  maritalStatus: '', partnerName: '', partnerOccupation: '', salary: '', yearsOfExperience: '', // NEW — staff roles
  departmentId: '', courseId: '', regulationId: '', // NEW — Teacher/Student
  rollNumber: '', fatherName: '', motherName: '', guardianName: '', fatherOccupation: '', motherOccupation: '', guardianOccupation: '', identificationMark1: '', identificationMark2: '', isRegular: '', // NEW — Student
  });
  const [editUserError, setEditUserError] = useState('');
  // const [isEditingUser, setIsEditingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [viewUser, setViewUser] = useState<UserListItem | null>(null);
  const [departmentList, setDepartmentList] = useState<DepartmentItem[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState('');
  const [departmentSuccess, setDepartmentSuccess] = useState('');
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
  const [addDepartmentForm, setAddDepartmentForm] = useState({ code: '', name: '' });
  const [addDepartmentError, setAddDepartmentError] = useState('');
  const [isSavingDepartment, setIsSavingDepartment] = useState(false);
  const [editDepartmentTarget, setEditDepartmentTarget] = useState<DepartmentItem | null>(null);
  const [editDepartmentForm, setEditDepartmentForm] = useState({ code: '', name: '' });
  const [editDepartmentError, setEditDepartmentError] = useState('');
  const [isSavingEditDepartment, setIsSavingEditDepartment] = useState(false);
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(null);
  const [courseList, setCourseList] = useState<CourseItem[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [addCourseForm, setAddCourseForm] = useState({ code: '', name: '', duration: '' });
  const [addCourseError, setAddCourseError] = useState('');
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [addDepartmentTarget, setAddDepartmentTarget] = useState<{ id: string; name: string } | null>(null);
  const [assignDepartmentForm, setAssignDepartmentForm] = useState({ departmentId: '' });
  const [assignDepartmentError, setAssignDepartmentError] = useState('');
  const [isSavingDepartmentAssignment, setIsSavingDepartmentAssignment] = useState(false);
  const [removingDepartmentKey, setRemovingDepartmentKey] = useState<string | null>(null);
  const [regulations, setRegulations] = useState<RegulationItem[]>([]);
  const [regulationsLoading, setRegulationsLoading] = useState(false);
  const [selectedRegulation, setSelectedRegulation] = useState<RegulationItem | null>(null);
  const [syllabusSubjects, setSyllabusSubjects] = useState<SyllabusSubject[]>([]);
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [feesLoading, setFeesLoading] = useState(false);
  const [feesError, setFeesError] = useState('');
  const [feeCategories, setFeeCategories] = useState<FeeCategoryItem[]>([]);
  const [feeStudents, setFeeStudents] = useState<FeeStudentItem[]>([]);
  const [deletingFeeId, setDeletingFeeId] = useState<string | null>(null);
  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [attendanceRegulations, setAttendanceRegulations] = useState<{ id: string; name: string }[]>([]);
  const [attendanceRegulationId, setAttendanceRegulationId] = useState('');
  const [attendanceSubjectId, setAttendanceSubjectId] = useState('');
  const [attendanceSubjects, setAttendanceSubjects] = useState<{ id: string; code: string; name: string; semester: string; regulation: { id: string; name: string }; department: { id: string; code: string; name: string } }[]>([]);
  const [attendanceStudents, setAttendanceStudents] = useState<{ id: string; rollNumber: string; name: string; collegeId: string; department: string | null }[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, boolean>>({});
  const [attendanceMarkedDays, setAttendanceMarkedDays] = useState<number[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState('');
  const [attendanceErr, setAttendanceErr] = useState('');
  const [activePage, setActivePage] = useState<'overview' | 'users' | 'create-users' | 'departments' | 'students' | 'teachers' | 'exam-cell' | 'fees' | 'syllabus' | 'attendance' | 'profile' | 'edit-user' | 'view-user'>('overview');  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mobileNavOpen, setMobileNavOpen] = useState(false); // NEW
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('collegePortalUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
      } catch {
        localStorage.removeItem('collegePortalUser');
      }
    }
  }, []);

  useEffect(() => {
    if (user && (user.role === 'SUPER_ADMIN' || user.role === 'CHAIRMAN')) {
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (user && (user.role === 'SUPER_ADMIN' || user.role === 'CHAIRMAN')) {
      fetchDepartments();
      fetchCourses();
      fetchRegulations();
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        collegeId,
        password,
      });

      const { token, user: loggedInUser } = response.data as {
        token: string;
        user: User;
      };

      localStorage.setItem('collegePortalToken', token);
      localStorage.setItem('collegePortalUser', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Unable to sign in with the provided credentials.'
        : 'Unable to sign in with the provided credentials.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) {
      return;
    }

    setUsersLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const allUsers = response.data.users || [];
      setUsers(allUsers);

      const groupedUsers = allUsers.reduce((acc: Record<string, UserListItem[]>, entry: UserListItem) => {
        const roleKey = entry.role;
        acc[roleKey] = acc[roleKey] ? [...acc[roleKey], entry] : [entry];
        return acc;
      }, {});

      setRoleGroups(groupedUsers);
    } catch (err) {
      console.error('Failed to load users', err);
      setUsers([]);
      setRoleGroups({});
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateUserError('');
    setCreateUserSuccess('');
    setIsCreatingUser(true);

    try {
      const token = localStorage.getItem('collegePortalToken');
      // after
      const formData = new FormData();
      Object.entries(createUserForm).forEach(([key, value]) => {
        if (value) formData.append(key, value as string);
      });
      
      if (profilePhotoFile) formData.append('profilePhoto', profilePhotoFile);
      teacherDocuments.forEach((file) => formData.append('documents', file));

      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } },
      );

      setCreateUserSuccess(response.data.message || 'User created successfully.');
      setCreateUserForm({
        username: '',
        collegeId: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'Select a Role',
        dob: '',
        joiningDate: '',
        yearsOfExperience: '',
        phoneNumber: '',
        gender: '',
        religion: '',
        maritalStatus: '',
        partnerName: '',
        partnerOccupation: '',
        departmentId: '',
        courseId: '',
        regulationId: '',
        address: '',
        salary: '',
        rollNumber: '',
        fatherName: '',
        motherName: '',
        guardianName: '',
        fatherOccupation: '',
        motherOccupation: '',
        guardianOccupation: '',
        identificationMark1: '',
        identificationMark2: '',
        isRegular: '',
      });
      setProfilePhotoFile(null);       // NEW
      setTeacherDocuments([]);         // NEW
      setFileInputResetKey((k) => k + 1); // NEW — forces the file inputs to remount and clear
      await fetchUsers();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Unable to create user.'
        : 'Unable to create user.';
      setCreateUserError(message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const fetchDepartments = async () => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return;
    setDepartmentsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/departments`, { headers: { Authorization: `Bearer ${token}` } });
      setDepartmentList(response.data.departments || []);
    } catch (err) {
      console.error('Failed to load departments', err);
      setDepartmentList([]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const fetchCourses = async () => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return;
    setCoursesLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/courses`, { headers: { Authorization: `Bearer ${token}` } });
      setCourseList(response.data.courses || []);
    } catch (err) {
      console.error('Failed to load courses', err);
      setCourseList([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  /* ---------------- Syllabus ---------------- */

  const fetchRegulations = async () => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return;
    setRegulationsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/syllabus/regulations`, { headers: { Authorization: `Bearer ${token}` } });
      setRegulations(response.data.regulations || []);
    } catch (err) {
      console.error('Failed to load regulations', err);
      setRegulations([]);
    } finally {
      setRegulationsLoading(false);
    }
  };

  const loadSubjects = async (regulationId: string, departmentId?: string) => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return;
    setSyllabusLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/syllabus/${regulationId}/subjects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: departmentId ? { departmentId } : {},
      });
      setSyllabusSubjects(response.data.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects', err);
      setSyllabusSubjects([]);
    } finally {
      setSyllabusLoading(false);
    }
  };

  const addRegulation = async (name: string): Promise<{ ok: boolean; message: string }> => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return { ok: false, message: 'You are not signed in.' };
    try {
      const response = await axios.post(`${API_URL}/api/syllabus/regulations`, { name }, { headers: { Authorization: `Bearer ${token}` } });
      const created = response.data.regulation as { id: string; name: string };
      setRegulations((current) => [...current, { id: created.id, name: created.name, subjectCount: 0, departments: 0 }]);
      return { ok: true, message: response.data.message || 'Regulation added successfully.' };
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to add regulation.' : 'Unable to add regulation.';
      return { ok: false, message };
    }
  };

  const deleteRegulation = async (regulation: RegulationItem): Promise<{ ok: boolean; message: string }> => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return { ok: false, message: 'You are not signed in.' };
    try {
      const response = await axios.delete(`${API_URL}/api/syllabus/regulations/${regulation.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setRegulations((current) => current.filter((r) => r.id !== regulation.id));
      if (selectedRegulation?.id === regulation.id) {
        setSelectedRegulation(null);
        setSyllabusSubjects([]);
      }
      return { ok: true, message: response.data.message || 'Regulation deleted successfully.' };
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to delete regulation.' : 'Unable to delete regulation.';
      return { ok: false, message };
    }
  };

  const saveSubject = async (payload: {
    subjectId?: string;
    departmentId: string;
    courseId: string;
    year: string;
    semester: string;
    code: string;
    name: string;
    credits: number;
  }): Promise<{ ok: boolean; message: string }> => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return { ok: false, message: 'You are not signed in.' };
    if (!selectedRegulation) return { ok: false, message: 'Select a regulation first.' };
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (payload.subjectId) {
        const response = await axios.patch(
          `${API_URL}/api/syllabus/subjects/${payload.subjectId}`,
          { departmentId: payload.departmentId, courseId: payload.courseId || undefined, year: payload.year, semester: payload.semester, code: payload.code, name: payload.name, credits: payload.credits },
          { headers },
        );
        const updated = response.data.subject as SyllabusSubject;
        setSyllabusSubjects((current) => current.map((s) => (s.id === updated.id ? updated : s)));
        fetchRegulations();
        return { ok: true, message: response.data.message || 'Subject updated successfully.' };
      }
      const response = await axios.post(
        `${API_URL}/api/syllabus/${selectedRegulation.id}/subjects`,
        { departmentId: payload.departmentId, courseId: payload.courseId || undefined, year: payload.year, semester: payload.semester, code: payload.code, name: payload.name, credits: payload.credits },
        { headers },
      );
      const created = response.data.subject as SyllabusSubject;
      setSyllabusSubjects((current) => [...current, created]);
      fetchRegulations();
      return { ok: true, message: response.data.message || 'Subject added successfully.' };
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to save subject.' : 'Unable to save subject.';
      return { ok: false, message };
    }
  };

  const deleteSubject = async (subject: SyllabusSubject): Promise<{ ok: boolean; message: string }> => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return { ok: false, message: 'You are not signed in.' };
    setDeletingSubjectId(subject.id);
    try {
      const response = await axios.delete(`${API_URL}/api/syllabus/subjects/${subject.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSyllabusSubjects((current) => current.filter((s) => s.id !== subject.id));
      fetchRegulations();
      return { ok: true, message: response.data.message || 'Subject deleted successfully.' };
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to delete subject.' : 'Unable to delete subject.';
      return { ok: false, message };
    } finally {
      setDeletingSubjectId(null);
    }
  };

  const fetchFees = async (): Promise<void> => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return;
    setFeesLoading(true);
    setFeesError('');
    try {
      const isStaff = user && ['SUPER_ADMIN', 'CHAIRMAN', 'ADMIN', 'EXAM_CELL', 'ACCOUNTANT'].includes(user.role);
      const url = isStaff ? `${API_URL}/api/fees` : `${API_URL}/api/fees/me`;
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setFees(response.data.fees || []);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to load fee entries.' : 'Unable to load fee entries.';
      setFeesError(message);
      setFees([]);
    } finally {
      setFeesLoading(false);
    }
  };

  const fetchFeeMeta = async (): Promise<void> => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return;
    try {
      const [categoriesRes, studentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/fees/categories`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/fees/students`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setFeeCategories(categoriesRes.data.categories || []);
      setFeeStudents(studentsRes.data.students || []);
    } catch {
      setFeeCategories([]);
      setFeeStudents([]);
    }
  };

  const addFee = async (payload: {
    studentId: string;
    categoryId: string;
    amount: number;
    dueDate?: string;
  }): Promise<{ ok: boolean; message: string }> => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return { ok: false, message: 'You are not signed in.' };
    try {
      const response = await axios.post(
        `${API_URL}/api/fees`,
        {
          studentId: payload.studentId,
          categoryId: payload.categoryId || null,
          amount: payload.amount,
          dueDate: payload.dueDate || null,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const created = response.data.fee as FeeItem;
      setFees((current) => [created, ...current]);
      return { ok: true, message: response.data.message || 'Fee entry added successfully.' };
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to add fee entry.' : 'Unable to add fee entry.';
      return { ok: false, message };
    }
  };

  const deleteFee = async (fee: FeeItem): Promise<{ ok: boolean; message: string }> => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return { ok: false, message: 'You are not signed in.' };
    setDeletingFeeId(fee.id);
    try {
      const response = await axios.delete(`${API_URL}/api/fees/${fee.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setFees((current) => current.filter((f) => f.id !== fee.id));
      return { ok: true, message: response.data.message || 'Fee entry deleted successfully.' };
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to delete fee entry.' : 'Unable to delete fee entry.';
      return { ok: false, message };
    } finally {
      setDeletingFeeId(null);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Attendance API functions                                           */
  /* ------------------------------------------------------------------ */

  const fetchAttendanceSubjects = async (regulationId: string = attendanceRegulationId) => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return;
    try {
      // Subjects are gated by regulation — no regulation means an empty list
      if (!regulationId) {
        setAttendanceSubjects([]);
        return;
      }
      const response = await axios.get(`${API_URL}/api/attendance/subjects`, {
        params: { regulationId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendanceSubjects(response.data.subjects || []);
    } catch (err) {
      console.error('Failed to load attendance subjects', err);
    }
  };

  const fetchAttendanceRegulations = async () => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/api/attendance/regulations`, { headers: { Authorization: `Bearer ${token}` } });
      setAttendanceRegulations(response.data.regulations || []);
    } catch (err) {
      console.error('Failed to load attendance regulations', err);
      setAttendanceRegulations([]);
    }
  };

  const fetchAttendanceStudents = async (subjectId: string) => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return;
    setAttendanceLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/attendance/students`, {
        params: { subjectId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendanceStudents(response.data.students || []);
    } catch (err) {
      console.error('Failed to load attendance students', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchAttendanceRecords = async (date: Date, subjectId: string) => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token || !subjectId) return;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    try {
      const response = await axios.get(`${API_URL}/api/attendance`, {
        params: { date: dateStr, subjectId },
        headers: { Authorization: `Bearer ${token}` },
      });
      const records: Record<string, boolean> = {};
      (response.data.records || []).forEach((r: { studentId: string; present: boolean }) => {
        records[r.studentId] = r.present;
      });
      setAttendanceRecords(records);
    } catch (err) {
      console.error('Failed to load attendance records', err);
    }
  };

  const fetchAttendanceMarkedDays = async (subjectId: string, month: number, year: number) => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token || !subjectId) return;
    try {
      const response = await axios.get(`${API_URL}/api/attendance/dates`, {
        params: { subjectId, month: month + 1, year },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendanceMarkedDays(response.data.days || []);
    } catch (err) {
      console.error('Failed to load attendance marked days', err);
    }
  };

  const saveAttendance = async (): Promise<{ ok: boolean; message: string }> => {
    const token = localStorage.getItem('collegePortalToken');
    if (!token) return { ok: false, message: 'You are not signed in.' };
    if (!attendanceSubjectId) return { ok: false, message: 'Please select a subject.' };

    setAttendanceSaving(true);
    setAttendanceErr('');
    setAttendanceMsg('');

    try {
      const dateStr = `${attendanceDate.getFullYear()}-${String(attendanceDate.getMonth() + 1).padStart(2, '0')}-${String(attendanceDate.getDate()).padStart(2, '0')}`;

      // If records is empty (user clicked Remove), delete attendance for this date+subject
      const hasAny = Object.keys(attendanceRecords).length > 0;
      if (!hasAny) {
        const response = await axios.delete(
          `${API_URL}/api/attendance`,
          { data: { date: dateStr, subjectId: attendanceSubjectId }, headers: { Authorization: `Bearer ${token}` } },
        );
        fetchAttendanceMarkedDays(attendanceSubjectId, attendanceDate.getMonth(), attendanceDate.getFullYear());
        return { ok: true, message: response.data.message || 'Attendance cleared.' };
      }

      const records = attendanceStudents
        .filter((s) => attendanceRecords[s.id] !== undefined)
        .map((s) => ({ studentId: s.id, present: attendanceRecords[s.id]! }));

      const response = await axios.post(
        `${API_URL}/api/attendance`,
        { date: dateStr, subjectId: attendanceSubjectId, records },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Refresh marked days for calendar dots
      fetchAttendanceMarkedDays(attendanceSubjectId, attendanceDate.getMonth(), attendanceDate.getFullYear());

      return { ok: true, message: response.data.message || 'Attendance saved successfully.' };
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to save attendance.' : 'Unable to save attendance.';
      return { ok: false, message };
    } finally {
      setAttendanceSaving(false);
    }
  };

  const openSyllabus = (regulation: RegulationItem) => {
    setSelectedRegulation(regulation);
    setActivePage('syllabus');
    loadSubjects(regulation.id);
  };

  const handleCreateDepartment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddDepartmentError('');
    if (!addDepartmentForm.code.trim() || !addDepartmentForm.name.trim()) {
      setAddDepartmentError('Both department code and name are required.');
      return;
    }
    setIsSavingDepartment(true);
    try {
      const token = localStorage.getItem('collegePortalToken');
      const response = await axios.post(
        `${API_URL}/api/departments`,
        { code: addDepartmentForm.code.trim(), name: addDepartmentForm.name.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDepartmentList((current) => [...current, response.data.department]);
      setIsAddDepartmentOpen(false);
      setDepartmentError('');
      setDepartmentSuccess('Department created successfully.');
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to create department.' : 'Unable to create department.';
      setAddDepartmentError(message);
    } finally {
      setIsSavingDepartment(false);
    }
  };

  const openAddCourse = () => {
    setAddCourseForm({ code: '', name: '', duration: '' });
    setAddCourseError('');
    setIsAddCourseOpen(true);
  };

  const openAddDepartment = (course: CourseItem) => {
    setAddDepartmentTarget({ id: course.id, name: course.name });
    setAssignDepartmentForm({ departmentId: '' });
    setAssignDepartmentError('');
  };

  const openEditDepartment = (dept: DepartmentItem) => {
    setEditDepartmentTarget(dept);
    setEditDepartmentForm({ code: dept.code, name: dept.name });
    setEditDepartmentError('');
  };

  const handleEditDepartment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditDepartmentError('');
    if (!editDepartmentForm.code.trim() || !editDepartmentForm.name.trim()) {
      setEditDepartmentError('Both department code and name are required.');
      return;
    }
    if (!editDepartmentTarget) return;
    setIsSavingEditDepartment(true);
    try {
      const token = localStorage.getItem('collegePortalToken');
      const response = await axios.patch(
        `${API_URL}/api/departments/${editDepartmentTarget.id}`,
        { code: editDepartmentForm.code.trim(), name: editDepartmentForm.name.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDepartmentList((current) =>
        current.map((d) => (d.id === editDepartmentTarget.id ? { ...d, code: response.data.department.code, name: response.data.department.name } : d)),
      );
      setEditDepartmentTarget(null);
      setDepartmentError('');
      setDepartmentSuccess('Department updated successfully.');
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to update department.' : 'Unable to update department.';
      setEditDepartmentError(message);
    } finally {
      setIsSavingEditDepartment(false);
    }
  };

  const handleDeleteDepartment = async (dept: DepartmentItem) => {
    const confirmed = window.confirm(`Delete "${dept.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingDepartmentId(dept.id);
    setDepartmentError('');
    try {
      const token = localStorage.getItem('collegePortalToken');
      await axios.delete(`${API_URL}/api/departments/${dept.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setDepartmentList((current) => current.filter((d) => d.id !== dept.id));
      setDepartmentSuccess('Department deleted successfully.');
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to delete department.' : 'Unable to delete department.';
      setDepartmentError(message);
    } finally {
      setDeletingDepartmentId(null);
    }
  };

  const handleCreateCourse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddCourseError('');
    if (!addCourseForm.code.trim() || !addCourseForm.name.trim() || !addCourseForm.duration.trim()) {
      setAddCourseError('Course code, name and duration are required.');
      return;
    }
    setIsSavingCourse(true);
    try {
      const token = localStorage.getItem('collegePortalToken');
      const response = await axios.post(
        `${API_URL}/api/courses`,
        { code: addCourseForm.code.trim(), name: addCourseForm.name.trim(), duration: Number(addCourseForm.duration) },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCourseList((current) => [...current, response.data.course]);
      setIsAddCourseOpen(false);
      setDepartmentError('');
      setDepartmentSuccess('Course created successfully.');
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to create course.' : 'Unable to create course.';
      setAddCourseError(message);
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (course: CourseItem) => {
    const confirmed = window.confirm(`Delete "${course.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingCourseId(course.id);
    setDepartmentError('');
    try {
      const token = localStorage.getItem('collegePortalToken');
      await axios.delete(`${API_URL}/api/courses/${course.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setCourseList((current) => current.filter((c) => c.id !== course.id));
      setDepartmentSuccess('Course deleted successfully.');
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to delete course.' : 'Unable to delete course.';
      setDepartmentError(message);
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handleAddDepartment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAssignDepartmentError('');
    if (!assignDepartmentForm.departmentId) {
      setAssignDepartmentError('Please select a department.');
      return;
    }
    if (!addDepartmentTarget) return;
    setIsSavingDepartmentAssignment(true);
    try {
      const token = localStorage.getItem('collegePortalToken');
      const response = await axios.post(
        `${API_URL}/api/courses/${addDepartmentTarget.id}/departments`,
        { departmentId: assignDepartmentForm.departmentId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCourseList((current) =>
        current.map((c) => (c.id === addDepartmentTarget.id ? { ...c, departments: [...c.departments, response.data.department] } : c)),
      );
      setAddDepartmentTarget(null);
      setDepartmentError('');
      setDepartmentSuccess('Department added to course.');
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to add department.' : 'Unable to add department.';
      setAssignDepartmentError(message);
    } finally {
      setIsSavingDepartmentAssignment(false);
    }
  };

  const handleRemoveDepartment = async (courseId: string, departmentId: string) => {
    setRemovingDepartmentKey(`${courseId}:${departmentId}`);
    setDepartmentError('');
    try {
      const token = localStorage.getItem('collegePortalToken');
      await axios.delete(`${API_URL}/api/courses/${courseId}/departments/${departmentId}`, { headers: { Authorization: `Bearer ${token}` } });
      setDepartmentSuccess('Department removed from course.');
      await fetchCourses();
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to remove department.' : 'Unable to remove department.';
      setDepartmentError(message);
    } finally {
      setRemovingDepartmentKey(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?');
    if (!confirmed) {
      return;
    }

    setDeleteError('');
    setDeleteSuccess('');
    setIsDeletingUser(userId);

    try {
      const token = localStorage.getItem('collegePortalToken');
      const response = await axios.delete(`${API_URL}/api/auth/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDeleteSuccess(response.data.message || 'User deleted successfully.');
      await fetchUsers();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Unable to delete user.'
        : 'Unable to delete user.';
      setDeleteError(message);
    } finally {
      setIsDeletingUser(null);
    }
  };

  const removeDocument = (indexToRemove: number) => {
    setTeacherDocuments((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const openEditUser = (item: UserListItem) => {
  const toDateInput = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  setEditUserForm({
    id: item.id, username: item.username, collegeId: item.collegeId, email: item.email,
    firstName: item.firstName, lastName: item.lastName, role: item.role, isActive: item.isActive,
    phoneNumber: item.phoneNumber ?? '',
    dob: toDateInput(item.dob),
    joiningDate: toDateInput(item.joiningDate),
    gender: item.gender ?? '',
    religion: item.religion ?? '',
    address: item.address ?? '',
    maritalStatus: item.maritalStatus ?? '',
    partnerName: item.partnerName ?? '',
    partnerOccupation: item.partnerOccupation ?? '',
    salary: item.salary != null ? String(item.salary) : '',
    yearsOfExperience: item.yearsOfExperience != null ? String(item.yearsOfExperience) : '',
    departmentId: item.departmentId ?? '',
    courseId: item.courseId ?? '',
    regulationId: item.regulationId ?? '',
    rollNumber: item.rollNumber ?? '',
    fatherName: item.fatherName ?? '',
    motherName: item.motherName ?? '',
    guardianName: item.guardianName ?? '',
    fatherOccupation: item.fatherOccupation ?? '',
    motherOccupation: item.motherOccupation ?? '',
    guardianOccupation: item.guardianOccupation ?? '',
    identificationMark1: item.identificationMark1 ?? '',
    identificationMark2: item.identificationMark2 ?? '',
    isRegular: item.isRegular === null ? '' : item.isRegular ? 'Regular' : 'Irregular',
  });
  setEditUserError('');
  // setIsEditingUser(true);
};

const handleUpdateUser = async (event: React.FormEvent<HTMLFormElement>): Promise<boolean> => {
  event.preventDefault();
  setEditUserError('');
  setIsUpdatingUser(true);
  try {
    const token = localStorage.getItem('collegePortalToken');
    // Helper: send undefined for empty strings so backend optional fields aren't rejected
    const s = (v: string) => (v.trim() === '' ? undefined : v.trim());
    await axios.patch(`${API_URL}/api/auth/users/${editUserForm.id}`, {
      username: s(editUserForm.username), collegeId: s(editUserForm.collegeId), email: s(editUserForm.email),
      firstName: s(editUserForm.firstName), lastName: s(editUserForm.lastName), role: editUserForm.role || undefined,
      isActive: editUserForm.isActive,
      phoneNumber: s(editUserForm.phoneNumber),
      dob: s(editUserForm.dob),
      joiningDate: s(editUserForm.joiningDate),
      gender: editUserForm.gender || undefined,
      religion: s(editUserForm.religion),
      address: s(editUserForm.address),
      maritalStatus: editUserForm.maritalStatus || undefined,
      partnerName: s(editUserForm.partnerName),
      partnerOccupation: s(editUserForm.partnerOccupation),
      salary: s(editUserForm.salary),
      yearsOfExperience: s(editUserForm.yearsOfExperience),
      departmentId: s(editUserForm.departmentId),
      courseId: s(editUserForm.courseId),
      regulationId: s(editUserForm.regulationId),
      rollNumber: s(editUserForm.rollNumber),
      fatherName: s(editUserForm.fatherName),
      motherName: s(editUserForm.motherName),
      guardianName: s(editUserForm.guardianName),
      fatherOccupation: s(editUserForm.fatherOccupation),
      motherOccupation: s(editUserForm.motherOccupation),
      guardianOccupation: s(editUserForm.guardianOccupation),
      identificationMark1: s(editUserForm.identificationMark1),
      identificationMark2: s(editUserForm.identificationMark2),
      isRegular: editUserForm.isRegular || undefined,
    }, { headers: { Authorization: `Bearer ${token}` } });
    await fetchUsers();
    return true;
  } catch (err) {
    const message = axios.isAxiosError(err) ? err.response?.data?.message || 'Unable to update user.' : 'Unable to update user.';
    setEditUserError(message);
    return false;
  } finally {
    setIsUpdatingUser(false);
  }
};

  const togglePasswordVisibility = (field: 'oldPassword' | 'newPassword' | 'confirmPassword') => {
    setShowPasswords((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem('collegePortalToken');
      const response = await axios.post(
        `${API_URL}/api/auth/change-password`,
        {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setPasswordSuccess(response.data.message || 'Password updated successfully.');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswords({ oldPassword: false, newPassword: false, confirmPassword: false });
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Unable to update password.'
        : 'Unable to update password.';
      setPasswordError(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('collegePortalToken');
    localStorage.removeItem('collegePortalUser');
    setUser(null);
    setError('');
  };

  if (user) {
    const title = roleTitles[user.role] || 'Dashboard';
    const stats = roleStats[user.role] || [
      { label: 'Overview', value: 'Live' },
      { label: 'Tasks', value: '8' },
      { label: 'Alerts', value: '2' },
    ];

    const navItems =
      user.role === 'SUPER_ADMIN' || user.role === 'CHAIRMAN'
        ? [
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'Users' },
            { id: 'create-users', label: 'Create Users' },
            { id: 'departments', label: 'Courses' },
            { id: 'syllabus', label: 'Syllabus' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'fees', label: 'Fees' },
            { id: 'profile', label: 'Profile' },
          ]
        : user.role === 'ADMIN'
          ? [
              { id: 'overview', label: 'Overview' },
              { id: 'syllabus', label: 'Syllabus' },
              { id: 'fees', label: 'Fees' },
              { id: 'profile', label: 'Profile' },
            ]
          : user.role === 'EXAM_CELL'
            ? [
                { id: 'overview', label: 'Overview' },
                { id: 'syllabus', label: 'Syllabus' },
                { id: 'fees', label: 'Fees' },
                { id: 'profile', label: 'Profile' },
              ]
            : user.role === 'ACCOUNTANT'
              ? [
                  { id: 'overview', label: 'Overview' },
                  { id: 'fees', label: 'Fees' },
                  { id: 'profile', label: 'Profile' },
                ]
              : user.role === 'TEACHER'
              ? [
                  { id: 'overview', label: 'Overview' },
                  { id: 'attendance', label: 'Attendance' },
                  { id: 'profile', label: 'Profile' },
                ]
              : [
                  { id: 'overview', label: 'Overview' },
                  { id: 'fees', label: 'Fees' },
                  { id: 'profile', label: 'Profile' },
                ];

    const analyticsCards = stats.map((item, index) => ({
      label: item.label,
      value: item.value,
      change: ['+8.2%', '+2.1%', '+12.4%', '+1.8%', '+0.0%'][index] || '+0.0%',
    }));

    const usersRoleTabs = [
      { value: 'ALL', label: 'All', count: users.length },
      { value: 'ADMIN', label: 'Admin', count: roleGroups.ADMIN?.length ?? 0 },
      { value: 'CHAIRMAN', label: 'Chairman', count: roleGroups.CHAIRMAN?.length ?? 0 },
      { value: 'EXAM_CELL', label: 'Exam Cell', count: roleGroups.EXAM_CELL?.length ?? 0 },
      { value: 'TEACHER', label: 'Teacher', count: roleGroups.TEACHER?.length ?? 0 },
      { value: 'STUDENT', label: 'Student', count: roleGroups.STUDENT?.length ?? 0 },
      { value: 'ACCOUNTANT', label: 'Accountant', count: roleGroups.ACCOUNTANT?.length ?? 0 },
    ];
    const roleOrder = ['SUPER_ADMIN', 'ADMIN', 'CHAIRMAN', 'EXAM_CELL', 'TEACHER', 'STUDENT', 'ACCOUNTANT'];
    const displayedRoleGroups =
      usersRoleFilter === 'ALL'
        ? Object.entries(roleGroups).sort(([a], [b]) => roleOrder.indexOf(a) - roleOrder.indexOf(b))
        : Object.entries(roleGroups).filter(([roleName]) => roleName === usersRoleFilter);

    const chartBars = [42, 58, 46, 72, 66, 88, 92];
    const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const sectionData: Record<string, { title: string; items: { name: string; value: string; accent: string }[] }> = {
      students: {
        title: 'Student Operations',
        items: [
          { name: 'New Admissions', value: '1,240', accent: 'bg-cyan-500' },
          { name: 'Active Students', value: '12,480', accent: 'bg-indigo-500' },
          { name: 'Attendance', value: '94.8%', accent: 'bg-emerald-500' },
        ],
      },
      teachers: {
        title: 'Faculty & Staff',
        items: [
          { name: 'Registered Teachers', value: '480', accent: 'bg-violet-500' },
          { name: 'Classes Assigned', value: '236', accent: 'bg-amber-500' },
          { name: 'Performance', value: '96.4%', accent: 'bg-rose-500' },
        ],
      },
      'exam-cell': {
        title: 'Exam Cell Center',
        items: [
          { name: 'Scheduled Exams', value: '18', accent: 'bg-sky-500' },
          { name: 'Results Published', value: '96%', accent: 'bg-teal-500' },
          { name: 'Recheck Requests', value: '14', accent: 'bg-pink-500' },
        ],
      },
      fees: {
        title: 'Fee Management',
        items: [
          { name: 'Collections', value: '$2.3M', accent: 'bg-emerald-500' },
          { name: 'Pending', value: '$184K', accent: 'bg-orange-500' },
          { name: 'Transactions', value: '8,245', accent: 'bg-blue-500' },
        ],
      },
    };

    const isDark = theme === 'dark';

    return (
      <div className={isDark ? 'dark' : ''}>
        <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} p-4 lg:p-6`}>
          <div className="mx-auto flex max-w-full gap-6">
            {mobileNavOpen ? (
              <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileNavOpen(false)} />
            ) : null}

            <aside
              className={`${isDark ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200'} fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r p-5 shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:block lg:w-72 lg:shrink-0 lg:translate-x-0 lg:rounded-3xl lg:border lg:shadow-2xl ${
                mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="mb-8 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Campus</p>
                    <h2 className="text-lg font-semibold">Northbridge</h2>
                  </div>
                </div>
                <button type="button" onClick={() => setMobileNavOpen(false)} className={`${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-900'} lg:hidden`} aria-label="Close menu">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                    setActivePage(item.id as 'overview' | 'users' | 'create-users' | 'departments' | 'students' | 'teachers' | 'exam-cell' | 'fees' | 'syllabus' | 'attendance' | 'profile');                      setSelectedRegulation(null);                      setQuickActionsOpen(false);
                      setMobileNavOpen(false); // NEW: close drawer after picking a page
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                      activePage === item.id
                        ? isDark ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-900 text-white shadow-lg'
                        : isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]">
                    {item.id === 'overview' ? 'Home' : item.id === 'users' ? 'Team' : item.id === 'create-users' ? 'New' : item.id === 'departments' ? 'Dept' : item.id === 'profile' ? 'Info' : item.id === 'students' ? 'Stu' : item.id === 'teachers' ? 'Fac' : item.id === 'exam-cell' ? 'Exam' : item.id === 'syllabus' ? 'Syl' : item.id === 'attendance' ? 'Att' : 'Fees'}                    </span>
                  </button>
                ))}
              </nav>

              <div className={`${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'} mt-10 rounded-2xl border p-4`}>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Access</p>
                <div className="mt-3 text-xl font-semibold">{user.role}</div>
                <p className="mt-2 text-sm text-slate-400">{title}</p>
              </div>
            </aside>

            <div className={`${isDark ? 'border-slate-800 bg-slate-900 shadow-2xl' : 'border-slate-200 bg-white shadow-xl'} flex-1 rounded-3xl border`}>
              <header className={`${isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'} flex flex-col gap-4 border-b px-6 py-5 md:flex-row md:items-center md:justify-between`}>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className={`${isDark ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white text-slate-700'} rounded-xl border p-2 lg:hidden`}
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.25em] text-secondary">Portal overview</p>
                    <h1 className={`mt-1 text-2xl font-semibold sm:mt-2 sm:text-3xl ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h1>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`${isDark ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white text-slate-700'} rounded-full border px-4 py-2 text-sm font-medium`}>
                    {user.firstName} {user.lastName}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setQuickActionsOpen((current) => !current)}
                      className={`${isDark ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'} rounded-xl border px-3 py-2 text-sm font-medium`}
                    >
                      Quick Actions
                    </button>

                    {quickActionsOpen ? (
                      <div className={`${isDark ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-700'} absolute right-0 z-20 mt-2 w-48 rounded-2xl border shadow-xl`}>
                        <button type="button" className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setActivePage('users'); setQuickActionsOpen(false); }}>
                          Manage Users
                        </button>
                        <button type="button" className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setActivePage('fees'); setQuickActionsOpen(false); }}>
                          View Fees
                        </button>
                        <button type="button" className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setTheme((current) => current === 'dark' ? 'light' : 'dark'); setQuickActionsOpen(false); }}>
                          Toggle Theme
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                    className={`${isDark ? 'bg-slate-800 text-yellow-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'} rounded-xl px-3 py-2 text-sm font-medium`}
                  >
                    {isDark ? 'Light' : 'Dark'}
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`${isDark ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-700'} rounded-xl px-4 py-2 text-sm font-medium transition`}
                  >
                    Logout
                  </button>
                </div>
              </header>

              <main className="p-6">
                {activePage === 'overview' ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {analyticsCards.map((card) => (
                        <div key={card.label} className={`${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-5`}>
                          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                            <span>{card.label}</span>
                            <span className="text-emerald-500">{card.change}</span>
                          </div>
                          <div className={`mt-5 text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Performance</p>
                            <h2 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Campus Trend</h2>
                          </div>
                          <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-500">+12.8%</div>
                        </div>

                        <div className="mt-6 flex h-44 items-end gap-3">
                          {chartBars.map((bar, index) => (
                            <div key={chartLabels[index]} className="flex flex-1 flex-col items-center gap-2">
                              <div
                                className="w-full rounded-t-2xl bg-gradient-to-t from-primary to-cyan-400"
                                style={{ height: `${bar}%` }}
                              />
                              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{chartLabels[index]}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Quick Summary</p>
                        <div className="mt-5 space-y-4">
                          {[
                            { label: 'Admissions', value: '1,240', tone: 'bg-cyan-500' },
                            { label: 'Faculty', value: '480', tone: 'bg-violet-500' },
                            { label: 'Fee Received', value: '$2.3M', tone: 'bg-emerald-500' },
                          ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-3">
                              <div className="flex items-center gap-3">
                                <span className={`h-2.5 w-2.5 rounded-full ${row.tone}`} />
                                <span className="text-sm text-slate-400">{row.label}</span>
                              </div>
                              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Staff snapshot</p>
                          <h3 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Operations</h3>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div className={`${isDark ? 'from-cyan-500/20 to-blue-500/10' : 'from-cyan-500/50 to-blue-500/40' } rounded-2xl bg-gradient-to-br p-4`}>
                          <div className={`${isDark ? 'text-white' : 'text-slate-900'} text-sm text-scale-400`}>Students</div>
                          <div className={`${isDark ? 'text-white':'text-slate-900'} mt-2 text-2xl font-semibold`}>12K+</div>
                        </div>
                        <div className={`${isDark ? 'from-violet-500/20 to-purple-500/10' : 'from-violet-500/40 to-purple-500/30' } rounded-2xl bg-gradient-to-br p-4`}>
                          <div className={`${isDark ? 'text-white' : 'text-slate-900'} text-sm text-scale-400`}>Faculty</div>
                          <div className={`${isDark ? 'text-white':'text-slate-900'} mt-2 text-2xl font-semibold`}>480</div>
                        </div>
                        <div className={`${isDark ? 'from-emerald-500/20 to-teal-500/10' : 'from-emerald-500/40 to-teal-500/30' } rounded-2xl bg-gradient-to-br p-4`}>
                          <div className={`${isDark ? 'text-white' : 'text-slate-900'} text-sm text-scale-400`}>Success Rate</div>
                          <div className={`${isDark ? 'text-white':'text-slate-900'} mt-2 text-2xl font-semibold`}>96.7%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activePage === 'create-users' && (user.role === 'SUPER_ADMIN' || user.role === 'CHAIRMAN') ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Administration</p>
                        <h3 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Create Users</h3>
                        <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>
                          Register a new account. The account appears in the Users list once created.
                        </p>
                      </div>
                      <button type="button" onClick={() => setActivePage('users')} className={`${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'} inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium`}>
                        <ArrowLeft className="h-4 w-4" />
                        Back to Users
                      </button>
                    </div>

                    <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'} rounded-2xl border p-6 shadow-sm`}>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>User details</h3>
                          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>
                            Allowed roles: {user.role === 'SUPER_ADMIN' ? 'Admin, Chairman, Exam Cell, Teacher, Student, Accountant' : 'Admin, Exam Cell, Teacher, Student'}
                          </p>
                        </div>
                      </div>

                      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateUser}>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Username</label>
                          <input required value={createUserForm.username} onChange={(e) => setCreateUserForm((current) => ({ ...current, username: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>College ID</label>
                          <input required value={createUserForm.collegeId} onChange={(e) => setCreateUserForm((current) => ({ ...current, collegeId: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>First name</label>
                          <input required value={createUserForm.firstName} onChange={(e) => setCreateUserForm((current) => ({ ...current, firstName: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Last name</label>
                          <input required value={createUserForm.lastName} onChange={(e) => setCreateUserForm((current) => ({ ...current, lastName: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Email</label>
                          <input required type="email" value={createUserForm.email} onChange={(e) => setCreateUserForm((current) => ({ ...current, email: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Phone number</label>
                          <input required type="tel" value={createUserForm.phoneNumber} onChange={(e) => setCreateUserForm((c) => ({ ...c, phoneNumber: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Gender</label>
                          <select required value={createUserForm.gender} onChange={(e) => setCreateUserForm((c) => ({ ...c, gender: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                            <option value="">Select Gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Religion</label>
                          <input value={createUserForm.religion} onChange={(e) => setCreateUserForm((c) => ({ ...c, religion: e.target.value }))} placeholder="e.g. Hindu, Muslim, Christian" className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Address</label>
                          <input required value={createUserForm.address} onChange={(e) => setCreateUserForm((c) => ({ ...c, address: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Profile picture</label>
                          <input required key={fileInputResetKey} type="file" accept="image/*" onChange={(e) => setProfilePhotoFile(e.target.files?.[0] ?? null)} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-2.5 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-white`} />
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Date of birth</label>
                          <input required type="date" value={createUserForm.dob} onChange={(e) => setCreateUserForm((c) => ({ ...c, dob: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Joining date</label>
                          <input required type="date" value={createUserForm.joiningDate} onChange={(e) => setCreateUserForm((c) => ({ ...c, joiningDate: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Upload documents</label>
                          {teacherDocuments.length > 0 ? (
                            <ul className="mt-2 space-y-1.5 mb-2">
                              {teacherDocuments.map((file, index) => (
                                <li
                                  key={`${file.name}-${file.lastModified}-${index}`}
                                  className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs ${isDark ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                                >
                                  <span className="truncate pr-2">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeDocument(index)}
                                    className="shrink-0 text-red-500 hover:text-red-600"
                                    aria-label={`Remove ${file.name}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          <input id="doc-file-input" key={fileInputResetKey} type="file" multiple onChange={(e) => setTeacherDocuments(Array.from(e.target.files ?? []))} className="sr-only" />
                          <label htmlFor="doc-file-input" className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90`}>
                            <Upload className="h-4 w-4" />
                            Choose Files
                          </label>
                          <span className={`ml-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {teacherDocuments.length > 0 ? `${teacherDocuments.length} file(s) selected` : 'No file chosen'}
                          </span>
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Password</label>
                          <div className="relative">
                            <input required
                              type={showCreatePassword ? 'text' : 'password'}
                              value={createUserForm.password}
                              placeholder="Set a password"
                              onChange={(e) => setCreateUserForm((current) => ({ ...current, password: e.target.value }))}
                              className={`${isDark ? 'border-slate-700 bg-slate-900 text-white pr-11' : 'border-slate-200 bg-slate-50 text-slate-900 pr-11'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCreatePassword((current) => !current)}
                              className={`${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'} absolute inset-y-0 right-3 flex items-center`}
                              aria-label="Toggle created user password visibility"
                            >
                              {showCreatePassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Role</label>
                          <select required value={createUserForm.role} onChange={(e) => setCreateUserForm((current) => ({ ...current, role: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                            {(user.role === 'SUPER_ADMIN' ? ['Select a Role', 'ADMIN', 'CHAIRMAN', 'EXAM_CELL', 'TEACHER', 'STUDENT', 'ACCOUNTANT'] : ['Select a Role','ADMIN', 'EXAM_CELL', 'TEACHER', 'STUDENT']).map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>
                        {['TEACHER', 'STUDENT'].includes(createUserForm.role) ? (
                          <>
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Course</label>
                              <select value={createUserForm.courseId} onChange={(e) => setCreateUserForm((c) => ({ ...c, courseId: e.target.value, departmentId: '' }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                                <option value="">Select course</option>
                                {courseList.map((course) => (
                                  <option key={course.id} value={course.id}>{course.code} — {course.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Department</label>
                              <select value={createUserForm.departmentId} onChange={(e) => setCreateUserForm((c) => ({ ...c, departmentId: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                                <option value="">{createUserForm.courseId
                                  ? (courseList.find((course) => course.id === createUserForm.courseId)?.departments?.length ? 'Select department' : 'No department for this course')
                                  : 'Select a course first'}</option>
                                {(createUserForm.courseId
                                  ? (courseList.find((course) => course.id === createUserForm.courseId)?.departments ?? [])
                                  : []
                                ).map((dept) => (
                                  <option key={dept.id} value={dept.id}>{dept.code} — {dept.name}</option>
                                ))}
                              </select>
                            </div>
                          </>
                        ) : null}
                        {['TEACHER', 'EXAM_CELL', 'ADMIN', 'ACCOUNTANT'].includes(createUserForm.role) ? (
                          <>
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Marital Status</label>
                              <select value={createUserForm.maritalStatus} onChange={(e) => setCreateUserForm((c) => ({ ...c, maritalStatus: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                                <option value="">Select marital status</option>
                                <option value="SINGLE">Single</option>
                                <option value="MARRIED">Married</option>
                                <option value="DIVORCED">Divorced</option>
                                <option value="WIDOWED">Widowed</option>
                              </select>
                            </div>
                            <div></div>
                            {createUserForm.maritalStatus === 'MARRIED' && (
                              <>
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Partner Name</label>
                                  <input type="text" value={createUserForm.partnerName} onChange={(e) => setCreateUserForm((c) => ({ ...c, partnerName: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                                </div>
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Partner Occupation</label>
                                  <input type="text" value={createUserForm.partnerOccupation} onChange={(e) => setCreateUserForm((c) => ({ ...c, partnerOccupation: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                                </div>
                              </>
                            )}
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Salary</label>
                              <input required type="number" min="0" step="0.01" value={createUserForm.salary} onChange={(e) => setCreateUserForm((c) => ({ ...c, salary: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                            </div>
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Years of experience</label>
                              <input required type="number" min="0" value={createUserForm.yearsOfExperience} onChange={(e) => setCreateUserForm((c) => ({ ...c, yearsOfExperience: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                            </div>
                          </>
                        ) : null}
                        {createUserForm.role === 'STUDENT' ? (
                          <>
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Roll number</label>
                              <input type="text" placeholder="Unique roll number" value={createUserForm.rollNumber} onChange={(e) => setCreateUserForm((c) => ({ ...c, rollNumber: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                            </div>
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Regular</label>
                              <select value={createUserForm.isRegular} onChange={(e) => setCreateUserForm((c) => ({ ...c, isRegular: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                                <option value="">Select</option>
                                <option value="Regular">Regular</option>
                                <option value="Irregular">Irregular</option>
                              </select>
                            </div>
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Regulation</label>
                              <select value={createUserForm.regulationId} onChange={(e) => setCreateUserForm((c) => ({ ...c, regulationId: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                                <option value="">Select regulation</option>
                                {regulations.map((reg) => (
                                  <option key={reg.id} value={reg.id}>{reg.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Father name</label>
                              <input type="text" value={createUserForm.fatherName} onChange={(e) => setCreateUserForm((c) => ({ ...c, fatherName: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                            </div>
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Father occupation</label>
                              <input type="text" value={createUserForm.fatherOccupation} onChange={(e) => setCreateUserForm((c) => ({ ...c, fatherOccupation: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                            </div>
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Mother name</label>
                              <input type="text" value={createUserForm.motherName} onChange={(e) => setCreateUserForm((c) => ({ ...c, motherName: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                            </div>
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Mother occupation</label>
                              <input type="text" value={createUserForm.motherOccupation} onChange={(e) => setCreateUserForm((c) => ({ ...c, motherOccupation: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                            </div>
                            {createUserForm.fatherName === '' && createUserForm.motherName === '' ? (
                              <>
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Guardian name</label>
                                  <input type="text" value={createUserForm.guardianName} onChange={(e) => setCreateUserForm((c) => ({ ...c, guardianName: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                                </div>
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Guardian occupation</label>
                                  <input type="text" value={createUserForm.guardianOccupation} onChange={(e) => setCreateUserForm((c) => ({ ...c, guardianOccupation: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                                </div>
                              </>
                            ) : null}
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Identification mark 1 (e.g. mole)</label>
                              <input type="text" value={createUserForm.identificationMark1} onChange={(e) => setCreateUserForm((c) => ({ ...c, identificationMark1: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                            </div>
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Identification mark 2</label>
                              <input type="text" value={createUserForm.identificationMark2} onChange={(e) => setCreateUserForm((c) => ({ ...c, identificationMark2: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                            </div>
                          </>
                        ) : null}
                        {createUserError ? <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{createUserError}</div> : null}
                        {createUserSuccess ? <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{createUserSuccess}</div> : null}

                        <div className="md:col-span-2">
                          <button type="submit" disabled={isCreatingUser} className="rounded-xl bg-primary px-4 py-3 font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70">
                            {isCreatingUser ? 'Creating user...' : 'Create user'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : activePage === 'users' && (user.role === 'SUPER_ADMIN' || user.role === 'CHAIRMAN') ? (
                  <div className="space-y-6">
                    <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'} rounded-2xl border p-6 shadow-sm`}>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Users</h3>
                          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>
                            All registered accounts, grouped by role. Create new ones from the Create Users page.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => fetchUsers()} className={`${isDark ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'} rounded-xl border px-3 py-2 text-sm font-medium`}>
                            Refresh
                          </button>
                          <button type="button" onClick={() => setActivePage('create-users')} className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90">
                            <Plus className="h-4 w-4" />
                            Add User
                          </button>
                        </div>
                      </div>

                      <div className="mb-4 flex flex-wrap gap-2">
                        {usersRoleTabs.map((tab) => (
                          <button
                            key={tab.value}
                            type="button"
                            onClick={() => setUsersRoleFilter(tab.value)}
                            className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                              usersRoleFilter === tab.value
                                ? isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-900 text-white shadow-sm'
                                : isDark ? 'bg-slate-900/40 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${usersRoleFilter === tab.value ? 'bg-white/20 text-white' : isDark ? 'bg-slate-700/60 text-slate-300' : 'bg-white text-slate-500'}`}>
                              {tab.count}
                            </span>
                          </button>
                        ))}
                      </div>

                      {deleteError ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</div> : null}
                      {deleteSuccess ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{deleteSuccess}</div> : null}

                      {usersLoading ? <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Loading users...</div> : users.length === 0 ? <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>No users found.</div> : (
                        <div className="space-y-6">
                          {displayedRoleGroups.length === 0 ? (
                            <div className={`rounded-xl border border-dashed px-4 py-10 text-center text-sm ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                              No {usersRoleTabs.find((t) => t.value === usersRoleFilter)?.label.toLowerCase() ?? 'users'} users found.
                            </div>
                          ) : null}
                          {displayedRoleGroups.map(([roleName, roleUsers]) => (
                            <div key={roleName} className={`${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'} rounded-xl border`}>
                              <div className={`${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-100'} border-b px-4 py-3`}>
                                <h4 className={`text-sm font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{roleName}</h4>
                              </div>
                              <div className="overflow-x-auto">
                                <table className={`min-w-full text-left text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                                  <thead>
                                    <tr className={isDark ? 'border-b border-slate-700 text-slate-400' : 'border-b border-slate-200 text-slate-500'}>
                                      <th className="px-3 py-2 font-medium">Name</th>
                                      <th className="px-3 py-2 font-medium">Username</th>
                                      <th className="px-3 py-2 font-medium">College ID</th>
                                      <th className="px-3 py-2 font-medium">Status</th>
                                      <th className="px-3 py-2 font-medium text-right">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {roleUsers.map((item) => (
                                      <tr key={item.id} className={isDark ? 'border-b border-slate-700' : 'border-b border-slate-100'}>
                                        <td className="px-3 py-3">{item.firstName} {item.lastName}</td>
                                        <td className="px-3 py-3">{item.username}</td>
                                        <td className="px-3 py-3">{item.collegeId}</td>
                                        <td className="px-3 py-3">
                                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.isActive ? 'Active' : 'Inactive'}
                                          </span>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                          <div className="flex flex-wrap items-center justify-end gap-2">
                                            <button type="button" onClick={() => { setViewUser(item); setActivePage('view-user'); }} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                                              View
                                            </button>
                                            <button type="button" onClick={() => { openEditUser(item); setActivePage('edit-user'); }} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                                              Edit
                                            </button>
                                            {item.id !== user?.id ? (
                                              <button type="button" onClick={() => handleDeleteUser(item.id)} disabled={isDeletingUser === item.id} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60">
                                                {isDeletingUser === item.id ? 'Deleting...' : 'Delete'}
                                              </button>
                                            ) : (
                                              <span className={isDark ? 'text-xs text-slate-500' : 'text-xs text-slate-400'}>Self</span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  ) : activePage === 'departments' && (user.role === 'SUPER_ADMIN' || user.role === 'CHAIRMAN') ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Administration</p>
                          <h3 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Course Management</h3>
                          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>Manage courses and the departments assigned to each course.</p>
                        </div>
                        <button
                          type="button"
                          onClick={openAddCourse}
                          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
                        >
                          <Plus className="h-4 w-4" />
                          Add Course
                        </button>
                      </div>

                      {departmentError ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{departmentError}</div> : null}
                      {departmentSuccess ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{departmentSuccess}</div> : null}

                      {coursesLoading ? (
                        <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Loading courses...</div>
                      ) : courseList.length === 0 ? (
                        <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>No courses yet. Click "Add Course" to create one.</div>
                      ) : (
                        <div className="space-y-4">
                          {courseList.map((course, index) => {
                            const isExpanded = !!expandedCourses[course.id];
                            return (
                              <div key={course.id} className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'} overflow-hidden rounded-2xl border shadow-sm`}>
                                <div className="flex w-full items-center justify-between gap-3 px-6 py-4">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedCourses((current) => ({ ...current, [course.id]: !current[course.id] }))}
                                    className="flex flex-1 items-center gap-3 text-left"
                                  >
                                    <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} text-sm font-medium`}>{index + 1}.</span>
                                    <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} rounded-lg border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide`}>{course.code}</span>
                                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{course.name}</span>
                                    <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs`}>{course.duration} {course.duration === 1 ? 'Year' : 'Years'}</span>
                                    <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs`}>{course.departments.length} Department{course.departments.length === 1 ? '' : 's'}</span>
                                  </button>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course); }}
                                      disabled={deletingCourseId === course.id}
                                      className="rounded-lg p-1.5 text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                      aria-label={`Delete ${course.name}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedCourses((current) => ({ ...current, [course.id]: !current[course.id] }))}
                                      className={isDark ? 'p-1.5 text-slate-400' : 'p-1.5 text-slate-500'}
                                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                    >
                                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                    </button>
                                  </div>
                                </div>

                                {isExpanded ? (
                                  <div className={`${isDark ? 'border-slate-800' : 'border-slate-200'} border-t px-6 py-4`}>
                                    <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Departments</p>
                                    {course.departments.length === 0 ? (
                                      <p className={`mb-4 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No departments assigned yet.</p>
                                    ) : (
                                      <ul className="mb-4 space-y-2">
                                        {course.departments.map((dept) => (
                                          <li key={dept.id} className={`${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'} flex items-center justify-between gap-3 rounded-xl border px-4 py-2`}>
                                            <div className="flex min-w-0 items-center gap-3">
                                              <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide`}>{dept.code}</span>
                                              <span className={`truncate text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{dept.name}</span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveDepartment(course.id, dept.id)}
                                              disabled={removingDepartmentKey === `${course.id}:${dept.id}`}
                                              className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                              {removingDepartmentKey === `${course.id}:${dept.id}` ? 'Removing...' : 'Remove'}
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    <div className="flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => openAddDepartment(course)}
                                        className={`${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'} flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium`}
                                      >
                                        <Plus className="h-4 w-4" />
                                        Assign Department
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'} overflow-hidden rounded-2xl border shadow-sm`}>
                        <div className="flex w-full items-center justify-between gap-3 px-6 py-4">
                          <div>
                            <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Manage Departments</h4>
                            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs`}>Create and edit the departments you can assign to courses.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setAddDepartmentForm({ code: '', name: '' }); setAddDepartmentError(''); setIsAddDepartmentOpen(true); }}
                            className={`${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'} flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium`}
                          >
                            <Plus className="h-4 w-4" />
                            Add Department
                          </button>
                        </div>
                        <div className={`${isDark ? 'border-slate-800' : 'border-slate-200'} border-t px-6 py-4`}>
                          {departmentsLoading ? (
                            <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Loading departments...</div>
                          ) : departmentList.length === 0 ? (
                            <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>No departments yet. Create one so you can assign it to a course.</div>
                          ) : (
                            <ul className="space-y-2">
                              {departmentList.map((dept, index) => (
                                <li key={dept.id} className={`${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'} flex items-center justify-between gap-3 rounded-xl border px-4 py-2`}>
                                  <div className="flex min-w-0 items-center gap-3">
                                    <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} text-sm font-medium`}>{index + 1}.</span>
                                    <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide`}>{dept.code}</span>
                                    <span className={`truncate text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{dept.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => openEditDepartment(dept)}
                                      className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} rounded-lg p-1.5`}
                                      aria-label={`Edit ${dept.name}`}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDepartment(dept)}
                                      disabled={deletingDepartmentId === dept.id}
                                      className="rounded-lg p-1.5 text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                      aria-label={`Delete ${dept.name}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : activePage === 'edit-user' ? (
                    <div className="space-y-6">
                      <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'} rounded-2xl border p-6 shadow-sm`}>
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Edit user</h3>
                            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>Update this user's details.</p>
                          </div>
                          <button type="button" onClick={() => setActivePage('users')} className={`${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'} rounded-xl border px-4 py-2 text-sm font-medium`}>
                            Back to Users
                          </button>
                        </div>

                        <form className="grid gap-4 md:grid-cols-2" onSubmit={async (e) => { const ok = await handleUpdateUser(e); if (ok) setActivePage('users'); }}>
                          <div>
                            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Username</label>
                            <input value={editUserForm.username} onChange={(e) => setEditUserForm((c) => ({ ...c, username: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                          </div>
                          <div>
                            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>College ID</label>
                            <input value={editUserForm.collegeId} onChange={(e) => setEditUserForm((c) => ({ ...c, collegeId: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                          </div>
                          <div>
                            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>First name</label>
                            <input value={editUserForm.firstName} onChange={(e) => setEditUserForm((c) => ({ ...c, firstName: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                          </div>
                          <div>
                            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Last name</label>
                            <input value={editUserForm.lastName} onChange={(e) => setEditUserForm((c) => ({ ...c, lastName: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                          </div>
                          <div className="md:col-span-2">
                            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Email</label>
                            <input type="email" value={editUserForm.email} onChange={(e) => setEditUserForm((c) => ({ ...c, email: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                          </div>
                          <div>
                            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Role</label>
                            <select value={editUserForm.role} onChange={(e) => setEditUserForm((c) => ({ ...c, role: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                              {(user.role === 'SUPER_ADMIN' ? ['Select a Role', 'ADMIN', 'CHAIRMAN', 'EXAM_CELL', 'TEACHER', 'STUDENT', 'ACCOUNTANT'] : ['Select a Role', 'ADMIN', 'EXAM_CELL', 'TEACHER', 'STUDENT']).map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Status</label>
                            <select value={editUserForm.isActive ? 'active' : 'inactive'} onChange={(e) => setEditUserForm((c) => ({ ...c, isActive: e.target.value === 'active' }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                          <div>
                            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Phone number</label>
                            <input type="tel" value={editUserForm.phoneNumber} onChange={(e) => setEditUserForm((c) => ({ ...c, phoneNumber: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                          </div>
                          <div>
                            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Gender</label>
                            <select value={editUserForm.gender} onChange={(e) => setEditUserForm((c) => ({ ...c, gender: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                              <option value="">Select Gender</option>
                              <option value="MALE">Male</option>
                              <option value="FEMALE">Female</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Religion</label>
                            <input value={editUserForm.religion} onChange={(e) => setEditUserForm((c) => ({ ...c, religion: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                          </div>
                          <div className="md:col-span-2">
                            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Address</label>
                            <input value={editUserForm.address} onChange={(e) => setEditUserForm((c) => ({ ...c, address: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                          </div>
                          <div>
                            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Date of birth</label>
                            <input type="date" value={editUserForm.dob} onChange={(e) => setEditUserForm((c) => ({ ...c, dob: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                          </div>
                          <div>
                            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Joining date</label>
                            <input type="date" value={editUserForm.joiningDate} onChange={(e) => setEditUserForm((c) => ({ ...c, joiningDate: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                          </div>

                          {['TEACHER', 'STUDENT'].includes(editUserForm.role) ? (
                            <>
                              <div>
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Course</label>
                                <select value={editUserForm.courseId} onChange={(e) => setEditUserForm((c) => ({ ...c, courseId: e.target.value, departmentId: '' }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                                  <option value="">Select course</option>
                                  {courseList.map((course) => (
                                    <option key={course.id} value={course.id}>{course.code} — {course.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Department</label>
                                <select value={editUserForm.departmentId} onChange={(e) => setEditUserForm((c) => ({ ...c, departmentId: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                                  <option value="">{editUserForm.courseId
                                    ? (courseList.find((course) => course.id === editUserForm.courseId)?.departments?.length ? 'Select department' : 'No department for this course')
                                    : 'Select a course first'}</option>
                                  {(editUserForm.courseId
                                    ? (courseList.find((course) => course.id === editUserForm.courseId)?.departments ?? [])
                                    : []
                                  ).map((dept) => (
                                    <option key={dept.id} value={dept.id}>{dept.code} — {dept.name}</option>
                                  ))}
                                </select>
                              </div>
                            </>
                          ) : null}
                          {['TEACHER', 'EXAM_CELL', 'ADMIN', 'ACCOUNTANT'].includes(editUserForm.role) ? (
                            <>
                              <div>
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Marital Status</label>
                                <select value={editUserForm.maritalStatus} onChange={(e) => setEditUserForm((c) => ({ ...c, maritalStatus: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                                  <option value="">Select marital status</option>
                                  <option value="SINGLE">Single</option>
                                  <option value="MARRIED">Married</option>
                                  <option value="DIVORCED">Divorced</option>
                                  <option value="WIDOWED">Widowed</option>
                                </select>
                              </div>
                              <div></div>
                              {editUserForm.maritalStatus === 'MARRIED' && (
                                <>
                                  <div>
                                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Partner Name</label>
                                    <input type="text" value={editUserForm.partnerName} onChange={(e) => setEditUserForm((c) => ({ ...c, partnerName: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                                  </div>
                                  <div>
                                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Partner Occupation</label>
                                    <input type="text" value={editUserForm.partnerOccupation} onChange={(e) => setEditUserForm((c) => ({ ...c, partnerOccupation: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                                  </div>
                                </>
                              )}
                              <div>
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Salary</label>
                                <input type="number" min="0" step="0.01" value={editUserForm.salary} onChange={(e) => setEditUserForm((c) => ({ ...c, salary: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                              </div>
                              <div>
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Years of experience</label>
                                <input type="number" min="0" value={editUserForm.yearsOfExperience} onChange={(e) => setEditUserForm((c) => ({ ...c, yearsOfExperience: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                              </div>
                            </>
                          ) : null}
                          {editUserForm.role === 'STUDENT' ? (
                            <>
                              <div>
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Regulation</label>
                                <select value={editUserForm.regulationId} onChange={(e) => setEditUserForm((c) => ({ ...c, regulationId: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                                  <option value="">Select regulation</option>
                                  {regulations.map((reg) => (
                                    <option key={reg.id} value={reg.id}>{reg.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Roll number</label>
                                <input type="text" placeholder="Unique roll number" value={editUserForm.rollNumber} onChange={(e) => setEditUserForm((c) => ({ ...c, rollNumber: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                              </div>
                              <div>
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Regular</label>
                                <select value={editUserForm.isRegular} onChange={(e) => setEditUserForm((c) => ({ ...c, isRegular: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}>
                                  <option value="">Select</option>
                                  <option value="Regular">Regular</option>
                                  <option value="Irregular">Irregular</option>
                                </select>
                              </div>
                              <div>
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Father name</label>
                                <input type="text" value={editUserForm.fatherName} onChange={(e) => setEditUserForm((c) => ({ ...c, fatherName: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                              </div>
                              <div>
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Father occupation</label>
                                <input type="text" value={editUserForm.fatherOccupation} onChange={(e) => setEditUserForm((c) => ({ ...c, fatherOccupation: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                              </div>
                              <div>
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Mother name</label>
                                <input type="text" value={editUserForm.motherName} onChange={(e) => setEditUserForm((c) => ({ ...c, motherName: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                              </div>
                              <div>
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Mother occupation</label>
                                <input type="text" value={editUserForm.motherOccupation} onChange={(e) => setEditUserForm((c) => ({ ...c, motherOccupation: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                              </div>
                              {editUserForm.fatherName === '' && editUserForm.motherName === '' ? (
                                <>
                                  <div>
                                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Guardian name</label>
                                    <input type="text" value={editUserForm.guardianName} onChange={(e) => setEditUserForm((c) => ({ ...c, guardianName: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                                  </div>
                                  <div>
                                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Guardian occupation</label>
                                    <input type="text" value={editUserForm.guardianOccupation} onChange={(e) => setEditUserForm((c) => ({ ...c, guardianOccupation: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                                  </div>
                                </>
                              ) : null}
                              <div>
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Identification mark 1 (e.g. mole)</label>
                                <input type="text" value={editUserForm.identificationMark1} onChange={(e) => setEditUserForm((c) => ({ ...c, identificationMark1: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                              </div>
                              <div>
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Identification mark 2</label>
                                <input type="text" value={editUserForm.identificationMark2} onChange={(e) => setEditUserForm((c) => ({ ...c, identificationMark2: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`} />
                              </div>
                            </>
                          ) : null}

                          {editUserError ? <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{editUserError}</div> : null}

                          <div className="flex justify-end gap-3 md:col-span-2">
                            <button type="button" onClick={() => setActivePage('users')} className={`${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'} rounded-xl border px-4 py-2.5 text-sm font-medium`}>
                              Cancel
                            </button>
                            <button type="submit" disabled={isUpdatingUser} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70">
                              {isUpdatingUser ? 'Saving...' : 'Save changes'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  ) : activePage === 'view-user' && viewUser ? (
                    <div className="space-y-6">
                      <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'} rounded-2xl border p-6 shadow-sm`}>
                        <div className="mb-6 flex items-center justify-between gap-3">
                          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>User details</h3>
                          <button type="button" onClick={() => setActivePage('users')} className={`${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'} rounded-xl border px-4 py-2 text-sm font-medium`}>
                            Back to Users
                          </button>
                        </div>
                        {viewUser.profilePhoto ? (
                          <div className={`${isDark ? 'border-slate-800' : 'border-slate-200'} mb-6 border-b pb-6`}>
                            <dt className={`mb-2 text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Profile picture</dt>
                            <img
                              src={`${API_URL}${viewUser.profilePhoto}`}
                              alt={`${viewUser.firstName} ${viewUser.lastName}`}
                              className="h-24 w-24 rounded-full border border-slate-700 object-cover"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : null}
                        <dl className="grid gap-4 sm:grid-cols-2">
                          <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Name</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.firstName} {viewUser.lastName}</dd></div>
                          <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Username</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.username}</dd></div>
                          <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>College ID</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.collegeId}</dd></div>
                          <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Email</dt><dd className={`mt-1 break-all text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.email}</dd></div>
                          <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Role</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.role}</dd></div>
                          <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Status</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.isActive ? 'Active' : 'Inactive'}</dd></div>
                          <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Created</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{new Date(viewUser.createdAt).toLocaleString()}</dd></div>
                          <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Phone number</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.phoneNumber || '—'}</dd></div>
                          <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Date of birth</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.dob ? new Date(viewUser.dob).toLocaleDateString() : '—'}</dd></div>
                          <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Joining date</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.joiningDate ? new Date(viewUser.joiningDate).toLocaleDateString() : '—'}</dd></div>
                          <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Gender</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.gender ? viewUser.gender.charAt(0) + viewUser.gender.slice(1).toLowerCase() : '—'}</dd></div>
                          <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Religion</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.religion || '—'}</dd></div>
                          <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Address</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.address || '—'}</dd></div>
                          {['TEACHER', 'EXAM_CELL', 'ADMIN', 'ACCOUNTANT'].includes(viewUser.role) ? (
                            <>
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Marital status</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.maritalStatus ? viewUser.maritalStatus.charAt(0) + viewUser.maritalStatus.slice(1).toLowerCase() : '—'}</dd></div>
                              {viewUser.maritalStatus === 'MARRIED' && (
                                <>
                                  <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Partner name</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.partnerName || '—'}</dd></div>
                                  <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Partner occupation</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.partnerOccupation || '—'}</dd></div>
                                </>
                              )}
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Years of experience</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.yearsOfExperience ?? '—'}</dd></div>
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Salary</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.salary != null ? `$${viewUser.salary.toLocaleString()}` : '—'}</dd></div>
                            </>
                          ) : null}
                          {viewUser.role === 'TEACHER' ? (
                            <>
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Course</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.course || 'Not assigned'}</dd></div>
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Department</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.department || 'Not assigned'}</dd></div>
                            </>
                          ) : null}
                          {viewUser.role === 'STUDENT' ? (
                            <>
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Roll number</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.rollNumber || '—'}</dd></div>
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Regular</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.isRegular === null ? '—' : viewUser.isRegular ? 'Regular' : 'Irregular'}</dd></div>
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Course</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.course || 'Not assigned'}</dd></div>
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Department</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.department || 'Not assigned'}</dd></div>
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Regulation</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.regulation || 'Not assigned'}</dd></div>
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Father name</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.fatherName || '—'}</dd></div>
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Father occupation</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.fatherOccupation || '—'}</dd></div>
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Mother name</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.motherName || '—'}</dd></div>
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Mother occupation</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.motherOccupation || '—'}</dd></div>
                              {!viewUser.fatherName && !viewUser.motherName ? (
                                <>
                                  <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Guardian name</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.guardianName || '—'}</dd></div>
                                  <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Guardian occupation</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.guardianOccupation || '—'}</dd></div>
                                </>
                              ) : null}
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Identification mark 1</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.identificationMark1 || '—'}</dd></div>
                              <div><dt className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Identification mark 2</dt><dd className={`mt-1 text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{viewUser.identificationMark2 || '—'}</dd></div>
                            </>
                          ) : null}
                        </dl>
                        {viewUser.documentUrls.length > 0 ? (
                          <div className={`${isDark ? 'border-slate-800' : 'border-slate-200'} mt-6 border-t pt-6`}>
                            <dt className={`mb-2 text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Documents</dt>
                            <div className="flex flex-wrap gap-2">
                              {viewUser.documentUrls.map((docUrl, index) => (
                                <a
                                  key={docUrl}
                                  href={`${API_URL}${docUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'} rounded-lg border px-3 py-1.5 text-xs font-medium`}
                                >
                                  Document {index + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                ) : activePage === 'profile' ? (
                  <div className="space-y-6">
                    <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`${isDark ? 'bg-slate-800 text-cyan-300' : 'bg-slate-200 text-slate-700'} flex h-16 w-16 items-center justify-center rounded-2xl`}>
                            <UserCircle className="h-10 w-10" />
                          </div>
                          <div>
                            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm uppercase tracking-[0.2em]`}>Account profile</p>
                            <h3 className={`mt-1 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {user.firstName} {user.lastName}
                            </h3>
                          </div>
                        </div>
                        <div className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">
                          Active account
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white'} rounded-2xl p-5 shadow-sm ring-1 ${isDark ? 'ring-slate-700' : 'ring-slate-200'}`}>
                          <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Role</div>
                          <div className="mt-2 text-lg font-semibold">{user.role}</div>
                        </div>
                        <div className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white'} rounded-2xl p-5 shadow-sm ring-1 ${isDark ? 'ring-slate-700' : 'ring-slate-200'}`}>
                          <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>College ID</div>
                          <div className="mt-2 text-lg font-semibold">{user.collegeId}</div>
                        </div>
                        <div className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white'} rounded-2xl p-5 shadow-sm ring-1 ${isDark ? 'ring-slate-700' : 'ring-slate-200'}`}>
                          <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Email</div>
                          <div className="mt-2 text-lg font-semibold break-all">{user.email}</div>
                        </div>
                        <div className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white'} rounded-2xl p-5 shadow-sm ring-1 ${isDark ? 'ring-slate-700' : 'ring-slate-200'}`}>
                          <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Last login</div>
                          <div className="mt-2 text-lg font-semibold">{new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                        </div>
                      </div>
                    </div>

                    <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                      <h3 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Change password</h3>

                      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleChangePassword}>
                        <div className="md:col-span-2">
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Current password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.oldPassword ? 'text' : 'password'}
                              value={passwordForm.oldPassword}
                              onChange={(e) => setPasswordForm((current) => ({ ...current, oldPassword: e.target.value }))}
                              className={`${isDark ? 'border-slate-700 bg-slate-900 text-white pr-11' : 'border-slate-200 bg-white text-slate-900 pr-11'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('oldPassword')}
                              className={`${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'} absolute inset-y-0 right-3 flex items-center`}
                              aria-label="Toggle current password visibility"
                            >
                              {showPasswords.oldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>New password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.newPassword ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm((current) => ({ ...current, newPassword: e.target.value }))}
                              className={`${isDark ? 'border-slate-700 bg-slate-900 text-white pr-11' : 'border-slate-200 bg-white text-slate-900 pr-11'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('newPassword')}
                              className={`${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'} absolute inset-y-0 right-3 flex items-center`}
                              aria-label="Toggle new password visibility"
                            >
                              {showPasswords.newPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Confirm new password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirmPassword ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm((current) => ({ ...current, confirmPassword: e.target.value }))}
                              className={`${isDark ? 'border-slate-700 bg-slate-900 text-white pr-11' : 'border-slate-200 bg-white text-slate-900 pr-11'} w-full rounded-xl border px-3 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`}
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('confirmPassword')}
                              className={`${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'} absolute inset-y-0 right-3 flex items-center`}
                              aria-label="Toggle confirm password visibility"
                            >
                              {showPasswords.confirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        {passwordError ? (
                          <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {passwordError}
                          </div>
                        ) : null}

                        {passwordSuccess ? (
                          <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            {passwordSuccess}
                          </div>
                        ) : null}

                        <div className="md:col-span-2">
                          <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="rounded-xl bg-primary px-4 py-3 font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isChangingPassword ? 'Updating password...' : 'Update password'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : activePage === 'students' ? (
                  <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Department</p>
                        <h3 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Students</h3>
                      </div>
                    </div>

                    {users.filter((entry) => entry.role === 'STUDENT').length === 0 ? (
                      <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>No students found.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className={`min-w-full text-left text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          <thead>
                            <tr className={isDark ? 'border-b border-slate-700 text-slate-400' : 'border-b border-slate-200 text-slate-500'}>
                              <th className="px-3 py-2 font-medium">Name</th>
                              <th className="px-3 py-2 font-medium">Roll number</th>
                              <th className="px-3 py-2 font-medium">Regular</th>
                              <th className="px-3 py-2 font-medium">Username</th>
                              <th className="px-3 py-2 font-medium">College ID</th>
                              <th className="px-3 py-2 font-medium">Email</th>
                              <th className="px-3 py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users
                              .filter((entry) => entry.role === 'STUDENT')
                              .map((entry) => (
                                <tr key={entry.id} className={isDark ? 'border-b border-slate-700' : 'border-b border-slate-100'}>
                                  <td className="px-3 py-3">{entry.firstName} {entry.lastName}</td>
                                  <td className="px-3 py-3">{entry.rollNumber || '—'}</td>
                                  <td className="px-3 py-3">{entry.isRegular === null ? '—' : entry.isRegular ? 'Regular' : 'Irregular'}</td>
                                  <td className="px-3 py-3">{entry.username}</td>
                                  <td className="px-3 py-3">{entry.collegeId}</td>
                                  <td className="px-3 py-3">{entry.email}</td>
                                  <td className="px-3 py-3">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${entry.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                      {entry.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : activePage === 'teachers' ? (
                  <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Department</p>
                        <h3 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Teachers</h3>
                      </div>
                    </div>

                    {users.filter((entry) => entry.role === 'TEACHER').length === 0 ? (
                      <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>No teachers found.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className={`min-w-full text-left text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          <thead>
                            <tr className={isDark ? 'border-b border-slate-700 text-slate-400' : 'border-b border-slate-200 text-slate-500'}>
                              <th className="px-3 py-2 font-medium">Name</th>
                              <th className="px-3 py-2 font-medium">Username</th>
                              <th className="px-3 py-2 font-medium">College ID</th>
                              <th className="px-3 py-2 font-medium">Email</th>
                              <th className="px-3 py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users
                              .filter((entry) => entry.role === 'TEACHER')
                              .map((entry) => (
                                <tr key={entry.id} className={isDark ? 'border-b border-slate-700' : 'border-b border-slate-100'}>
                                  <td className="px-3 py-3">{entry.firstName} {entry.lastName}</td>
                                  <td className="px-3 py-3">{entry.username}</td>
                                  <td className="px-3 py-3">{entry.collegeId}</td>
                                  <td className="px-3 py-3">{entry.email}</td>
                                  <td className="px-3 py-3">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${entry.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                      {entry.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : activePage === 'syllabus' ? (
                  <SyllabusManager
                    regulations={regulations}
                    regulationsLoading={regulationsLoading}
                    selectedRegulation={selectedRegulation}
                    onSelectRegulation={openSyllabus}
                    onBack={() => { setSelectedRegulation(null); setSyllabusSubjects([]); }}
                    subjects={syllabusSubjects}
                    subjectsLoading={syllabusLoading}
                    departments={departmentList}
                    courses={courseList}
                    isDark={isDark}
                    onLoadSubjects={loadSubjects}
                    onSaveSubject={saveSubject}
                    onDeleteSubject={deleteSubject}
                    onAddRegulation={addRegulation}
                    onDeleteRegulation={deleteRegulation}
                    deletingSubjectId={deletingSubjectId}
                  />
                ) : activePage === 'exam-cell' ? (
                  <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Department</p>
                        <h3 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Exam Cell</h3>
                      </div>
                    </div>

                    {users.filter((entry) => entry.role === 'EXAM_CELL').length === 0 ? (
                      <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>No exam cell members found.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className={`min-w-full text-left text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          <thead>
                            <tr className={isDark ? 'border-b border-slate-700 text-slate-400' : 'border-b border-slate-200 text-slate-500'}>
                              <th className="px-3 py-2 font-medium">Name</th>
                              <th className="px-3 py-2 font-medium">Username</th>
                              <th className="px-3 py-2 font-medium">College ID</th>
                              <th className="px-3 py-2 font-medium">Email</th>
                              <th className="px-3 py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users
                              .filter((entry) => entry.role === 'EXAM_CELL')
                              .map((entry) => (
                                <tr key={entry.id} className={isDark ? 'border-b border-slate-700' : 'border-b border-slate-100'}>
                                  <td className="px-3 py-3">{entry.firstName} {entry.lastName}</td>
                                  <td className="px-3 py-3">{entry.username}</td>
                                  <td className="px-3 py-3">{entry.collegeId}</td>
                                  <td className="px-3 py-3">{entry.email}</td>
                                  <td className="px-3 py-3">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${entry.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                      {entry.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : activePage === 'attendance' ? (
                  <AttendancePage
                    role={user.role}
                    regulations={attendanceRegulations}
                    selectedRegulationId={attendanceRegulationId}
                    subjects={attendanceSubjects}
                    students={attendanceStudents}
                    records={attendanceRecords}
                    markedDays={attendanceMarkedDays}
                    selectedDate={attendanceDate}
                    selectedSubjectId={attendanceSubjectId}
                    loading={attendanceLoading}
                    saving={attendanceSaving}
                    msg={attendanceMsg}
                    err={attendanceErr}
                    isDark={isDark}
                    onSelectDate={(d) => {
                      setAttendanceDate(d);
                      if (attendanceSubjectId) {
                        fetchAttendanceRecords(d, attendanceSubjectId);
                      }
                    }}
                    onSelectSubject={(id) => {
                      setAttendanceSubjectId(id);
                      setAttendanceRecords({});
                      if (id) {
                        fetchAttendanceStudents(id);
                        fetchAttendanceRecords(attendanceDate, id);
                        fetchAttendanceMarkedDays(id, attendanceDate.getMonth(), attendanceDate.getFullYear());
                      } else {
                        setAttendanceStudents([]);
                      }
                    }}
                    onSelectRegulation={(id) => {
                      setAttendanceRegulationId(id);
                      setAttendanceSubjectId('');
                      setAttendanceStudents([]);
                      setAttendanceRecords({});
                      setAttendanceMarkedDays([]);
                      fetchAttendanceSubjects(id);
                    }}
                    onSetRecord={(studentId, present) => {
                      setAttendanceRecords((prev) => ({ ...prev, [studentId]: present }));
                    }}
                    onMarkAll={(present) => {
                      const updated: Record<string, boolean> = {};
                      attendanceStudents.forEach((s) => { updated[s.id] = present; });
                      setAttendanceRecords(updated);
                    }}
                    onRemoveAll={() => { setAttendanceRecords({}); }}
                    onSave={saveAttendance}
                    onSetMsg={setAttendanceMsg}
                    onSetErr={setAttendanceErr}
                    onLoadSubjects={fetchAttendanceSubjects}
                    onLoadRegulations={fetchAttendanceRegulations}
                    onRefreshMarkedDays={(month, year) => {
                      if (attendanceSubjectId) fetchAttendanceMarkedDays(attendanceSubjectId, month, year);
                    }}
                  />
                ) : activePage === 'fees' ? (
                  <FeesManager
                    role={user.role}
                    fees={fees}
                    feesLoading={feesLoading}
                    feesError={feesError}
                    categories={feeCategories}
                    students={feeStudents}
                    isDark={isDark}
                    onLoadFees={fetchFees}
                    onLoadMeta={fetchFeeMeta}
                    onAddFee={addFee}
                    onDeleteFee={deleteFee}
                    deletingFeeId={deletingFeeId}
                  />
                ) : (
                  <div className={`${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'} rounded-2xl border p-6`}>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Department</p>
                    <h3 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{sectionData[activePage]?.title || 'Operations'}</h3>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      {(sectionData[activePage]?.items || []).map((item) => (
                        <div key={item.name} className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white'} rounded-2xl p-5 shadow-sm ring-1 ${isDark ? 'ring-slate-700' : 'ring-slate-200'}`}>
                          <div className={`h-2.5 w-12 rounded-full ${item.accent}`} />
                          <div className="mt-4 text-sm text-slate-400">{item.name}</div>
                          <div className="mt-2 text-2xl font-semibold">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </main>
              {isAddDepartmentOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'} w-full max-w-md rounded-2xl p-6 shadow-2xl`}>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Add New Department</h3>
                      <button type="button" onClick={() => setIsAddDepartmentOpen(false)} className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} aria-label="Close">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <form className="space-y-4" onSubmit={handleCreateDepartment}>
                      <div>
                        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Department Code</label>
                        <input value={addDepartmentForm.code} onChange={(e) => setAddDepartmentForm((c) => ({ ...c, code: e.target.value }))} placeholder="Enter department code" className={`${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'} w-full rounded-xl border px-3 py-2.5 outline-none`} />
                      </div>
                      <div>
                        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Department Name</label>
                        <input value={addDepartmentForm.name} onChange={(e) => setAddDepartmentForm((c) => ({ ...c, name: e.target.value }))} placeholder="Enter department name" className={`${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'} w-full rounded-xl border px-3 py-2.5 outline-none`} />
                      </div>
                      {addDepartmentError ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{addDepartmentError}</div> : null}
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setIsAddDepartmentOpen(false)} className={`${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'} rounded-xl border px-4 py-2.5 text-sm font-medium`}>
                          Cancel
                        </button>
                        <button type="submit" disabled={isSavingDepartment} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70">
                          {isSavingDepartment ? 'Saving...' : 'Save Department'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : null}
              {editDepartmentTarget ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'} w-full max-w-md rounded-2xl p-6 shadow-2xl`}>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Edit Department</h3>
                      <button type="button" onClick={() => setEditDepartmentTarget(null)} className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} aria-label="Close">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <form className="space-y-4" onSubmit={handleEditDepartment}>
                      <div>
                        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Department Code</label>
                        <input value={editDepartmentForm.code} onChange={(e) => setEditDepartmentForm((c) => ({ ...c, code: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'} w-full rounded-xl border px-3 py-2.5 outline-none`} />
                      </div>
                      <div>
                        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Department Name</label>
                        <input value={editDepartmentForm.name} onChange={(e) => setEditDepartmentForm((c) => ({ ...c, name: e.target.value }))} className={`${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'} w-full rounded-xl border px-3 py-2.5 outline-none`} />
                      </div>
                      {editDepartmentError ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{editDepartmentError}</div> : null}
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setEditDepartmentTarget(null)} className={`${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'} rounded-xl border px-4 py-2.5 text-sm font-medium`}>
                          Cancel
                        </button>
                        <button type="submit" disabled={isSavingEditDepartment} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70">
                          {isSavingEditDepartment ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : null}
              {isAddCourseOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'} w-full max-w-md rounded-2xl p-6 shadow-2xl`}>
                    <div className="mb-1 flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Add Course</h3>
                      <button type="button" onClick={() => setIsAddCourseOpen(false)} className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} aria-label="Close">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <p className={`mb-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Create a new course. You can assign departments to it afterwards.</p>
                    <form className="space-y-4" onSubmit={handleCreateCourse}>
                      <div>
                        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Course Code</label>
                        <input value={addCourseForm.code} onChange={(e) => setAddCourseForm((c) => ({ ...c, code: e.target.value }))} placeholder="Enter course code" className={`${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'} w-full rounded-xl border px-3 py-2.5 outline-none`} />
                      </div>
                      <div>
                        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Course Name</label>
                        <input value={addCourseForm.name} onChange={(e) => setAddCourseForm((c) => ({ ...c, name: e.target.value }))} placeholder="Enter course name" className={`${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'} w-full rounded-xl border px-3 py-2.5 outline-none`} />
                      </div>
                      <div>
                        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Duration (years)</label>
                        <input type="number" min="1" value={addCourseForm.duration} onChange={(e) => setAddCourseForm((c) => ({ ...c, duration: e.target.value }))} placeholder="e.g. 3" className={`${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'} w-full rounded-xl border px-3 py-2.5 outline-none`} />
                      </div>
                      {addCourseError ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{addCourseError}</div> : null}
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setIsAddCourseOpen(false)} className={`${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'} rounded-xl border px-4 py-2.5 text-sm font-medium`}>
                          Cancel
                        </button>
                        <button type="submit" disabled={isSavingCourse} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70">
                          {isSavingCourse ? 'Saving...' : 'Create Course'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : null}
              {addDepartmentTarget ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'} w-full max-w-md rounded-2xl p-6 shadow-2xl`}>
                    <div className="mb-1 flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Add Department</h3>
                      <button type="button" onClick={() => setAddDepartmentTarget(null)} className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} aria-label="Close">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <p className={`mb-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Assign a department to {addDepartmentTarget.name}.</p>
                    <form className="space-y-4" onSubmit={handleAddDepartment}>
                      <div>
                        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Department</label>
                        {departmentList.length === 0 ? (
                          <p className={`rounded-xl border px-3 py-2.5 text-sm ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>No departments available. Create one in "Manage Departments" first.</p>
                        ) : (
                          <select
                            value={assignDepartmentForm.departmentId}
                            onChange={(e) => setAssignDepartmentForm((c) => ({ ...c, departmentId: e.target.value }))}
                            className={`${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'} w-full rounded-xl border px-3 py-2.5 outline-none`}
                          >
                            <option value="">Select a department</option>
                            {departmentList.map((dept) => (
                              <option key={dept.id} value={dept.id}>{dept.code} — {dept.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      {assignDepartmentError ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{assignDepartmentError}</div> : null}
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setAddDepartmentTarget(null)} className={`${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'} rounded-xl border px-4 py-2.5 text-sm font-medium`}>
                          Cancel
                        </button>
                        <button type="submit" disabled={isSavingDepartmentAssignment || departmentList.length === 0} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70">
                          {isSavingDepartmentAssignment ? 'Saving...' : 'Add Department'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-4 lg:p-8">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-card lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative hidden bg-primary p-10 text-white lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(176,141,87,0.35),transparent_35%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Academic Excellence</p>
                  <h1 className="mt-1 text-2xl font-semibold">Northbridge College</h1>
                </div>
              </div>

              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  Trusted campus management
                </div>
                <h2 className="max-w-md text-4xl font-semibold leading-tight">
                  Smart systems for modern student success.
                </h2>
                <p className="mt-5 max-w-md text-slate-200">
                  A secure digital campus hub for academics, attendance, fee operations, examination management, and student support.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <BookOpen className="mb-3 h-6 w-6 text-accent" />
                  <div className="text-2xl font-semibold">12K+</div>
                  <div className="text-sm text-slate-200">Students</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <Landmark className="mb-3 h-6 w-6 text-accent" />
                  <div className="text-2xl font-semibold">42</div>
                  <div className="text-sm text-slate-200">Departments</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <ShieldCheck className="mb-3 h-6 w-6 text-accent" />
                  <div className="text-2xl font-semibold">99.8%</div>
                  <div className="text-sm text-slate-200">Security</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center bg-white p-6 sm:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8 text-left">
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-secondary">Portal access</p>
                <h3 className="mt-3 text-3xl font-semibold text-slate-900">Welcome back</h3>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="collegeId" className="mb-2 block text-sm font-medium text-slate-700">
                    College ID / Username
                  </label>
                  <input
                    id="collegeId"
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                    placeholder="Ex: FAU-1001"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 pr-11 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                    Remember me
                  </label>
                  <button type="button" className="font-medium text-primary hover:text-primary/80">
                    Forgot Password?
                  </button>
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Demo credentials: <span className="font-semibold">superadmin / Password@123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type SyllabusManagerProps = {
  regulations: RegulationItem[];
  regulationsLoading: boolean;
  selectedRegulation: RegulationItem | null;
  onSelectRegulation: (reg: RegulationItem) => void;
  onBack: () => void;
  subjects: SyllabusSubject[];
  subjectsLoading: boolean;
  departments: DepartmentItem[];
  courses: CourseItem[];
  isDark: boolean;
  onLoadSubjects: (regulationId: string, departmentId?: string) => Promise<void>;
  onSaveSubject: (payload: { subjectId?: string; departmentId: string; courseId: string; year: string; semester: string; code: string; name: string; credits: number }) => Promise<{ ok: boolean; message: string }>;
  onDeleteSubject: (subject: SyllabusSubject) => Promise<{ ok: boolean; message: string }>;
  onAddRegulation: (name: string) => Promise<{ ok: boolean; message: string }>;
  onDeleteRegulation: (regulation: RegulationItem) => Promise<{ ok: boolean; message: string }>;
  deletingSubjectId: string | null;
};

function SyllabusManager({
  regulations,
  regulationsLoading,
  selectedRegulation,
  onSelectRegulation,
  onBack,
  subjects,
  subjectsLoading,
  departments,
  courses,
  isDark,
  onLoadSubjects,
  onSaveSubject,
  onDeleteSubject,
  onAddRegulation,
  onDeleteRegulation,
  deletingSubjectId,
}: SyllabusManagerProps) {
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');
  const [form, setForm] = useState({ courseId: '', departmentId: '', year: '', semester: '', code: '', name: '', credits: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingSubject, setEditingSubject] = useState<SyllabusSubject | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [formErr, setFormErr] = useState('');
  const [newRegulation, setNewRegulation] = useState('');
  const [addRegOpen, setAddRegOpen] = useState(false);
  const [addRegErr, setAddRegErr] = useState('');
  const [listErr, setListErr] = useState('');
  const formCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDeptDropdownOpen(false);
    setDeptSearch('');
    setForm({ courseId: '', departmentId: '', year: '', semester: '', code: '', name: '', credits: '' });
    setErrors({});
    setEditingSubject(null);
    setFormMsg('');
    setFormErr('');
    setListErr('');
  }, [selectedRegulation?.id]);

  const card = `${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'} rounded-2xl border p-6 shadow-sm`;
  const inputClass = `${isDark ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400'} w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`;
  const labelClass = `mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`;
  const errClass = 'mt-1.5 text-sm text-red-600';

  const selectedCourse = courses.find((c) => c.id === form.courseId);
  // Departments only from the selected course — no course selected means no departments shown
  const courseDepts = selectedCourse?.departments ?? [];
  const filteredDepts = courseDepts.filter(
    (d) =>
      d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(deptSearch.toLowerCase()),
  );
  const selectedDept = departments.find((d) => d.id === form.departmentId);

  /* Year and semester dropdown options. Years come from the selected
     course's duration (1ST YEAR … NTH YEAR); each year offers the two
     semesters that belong to it (1 SEM & 2 SEM, 3 SEM & 4 SEM, …).     */
  const ORDINALS = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH'];
  /* "1ST YEAR" → "1st Year", "3 SEM" → "3rd Semester" (display only, value stays uppercase) */
  const formatOrdinal = (value: string, unit: string) => {
    const num = parseInt(value, 10);
    if (Number.isFinite(num)) {
      const ones = num % 10;
      const tens = Math.floor(num / 10) % 10;
      const suffix = tens === 1 ? 'th' : ones === 1 ? 'st' : ones === 2 ? 'nd' : ones === 3 ? 'rd' : 'th';
      return `${num}${suffix} ${unit}`;
    }
    return value;
  };
  const ensureValue = (opts: string[], current: string) => {
    if (current && !opts.includes(current)) return [...opts, current];
    return opts;
  };
  const courseYearOptions = Array.from({ length: selectedCourse?.duration ?? 0 }, (_, i) => `${ORDINALS[i] ?? `${i + 1}TH`} YEAR`);
  const yearOptions = ensureValue(courseYearOptions, form.year);
  const selectedYearIndex = courseYearOptions.indexOf(form.year);
  const semesterOptions = ensureValue(
    selectedYearIndex !== -1
      ? [`${selectedYearIndex * 2 + 1} SEM`, `${selectedYearIndex * 2 + 2} SEM`]
      : Array.from({ length: (selectedCourse?.duration ?? 0) * 2 }, (_, i) => `${i + 1} SEM`),
    form.semester,
  );

  /* Group subjects by Department, then Year, then Semester so the list
     renders as clearly separated sections instead of one flat table.   */
  const groupedSubjects = subjects.reduce<{ dept: { id: string; name: string; code: string }; years: { year: string; semesters: { semester: string; subjectsIn: SyllabusSubject[] }[] }[] }[]>((acc, sub) => {
    const deptId = sub.departmentId;
    const year = sub.year;
    const semester = sub.semester;
    let deptGroup = acc.find((g) => g.dept.id === deptId);
    if (!deptGroup) {
      deptGroup = { dept: { id: deptId, name: sub.department?.name ?? '—', code: sub.department?.code ?? '' }, years: [] };
      acc.push(deptGroup);
    }
    let yearGroup = deptGroup.years.find((y) => y.year === year);
    if (!yearGroup) {
      yearGroup = { year, semesters: [] };
      deptGroup.years.push(yearGroup);
    }
    let semGroup = yearGroup.semesters.find((s) => s.semester === semester);
    if (!semGroup) {
      semGroup = { semester, subjectsIn: [] };
      yearGroup.semesters.push(semGroup);
    }
    semGroup.subjectsIn.push(sub);
    return acc;
  }, []);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!form.courseId) {
      nextErrors.departmentId = 'Please select a course first.';
    } else if (!form.departmentId) {
      nextErrors.departmentId = 'Please select a department.';
    }
    if (!form.year.trim()) {
      nextErrors.year = 'Year is required.';
    }
    if (!form.semester.trim()) {
      nextErrors.semester = 'Semester is required.';
    }
    if (!form.code.trim()) {
      nextErrors.code = 'Subject code is required.';
    } else if (/^\s*$/.test(form.code)) {
      nextErrors.code = 'Subject code should not contain only spaces.';
    } else {
      const code = form.code.trim().toUpperCase();
      const duplicate = subjects.find(
        (s) =>
          s.code.toUpperCase() === code &&
          s.departmentId === form.departmentId &&
          s.id !== editingSubject?.id,
      );
      if (duplicate) nextErrors.code = `Subject code "${code}" already exists for this department.`;
    }
    if (!form.name.trim()) {
      nextErrors.name = 'Subject name is required.';
    } else if (form.name.trim().length < 3) {
      nextErrors.name = 'Subject name must be at least 3 characters.';
    }
    if (!form.credits.trim()) {
      nextErrors.credits = 'Subject credit is required.';
    } else {
      const credits = Number(form.credits);
      if (!Number.isFinite(credits) || credits <= 0 || !Number.isInteger(credits)) {
        nextErrors.credits = 'Credits must be a positive whole number.';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSelectDept = (deptId: string) => {
    setForm((current) => ({ ...current, departmentId: deptId }));
    setDeptDropdownOpen(false);
    setDeptSearch('');
    setErrors((current) => ({ ...current, departmentId: '' }));
    if (selectedRegulation) {
      onLoadSubjects(selectedRegulation.id, deptId || undefined);
    }
  };

  const clearDept = () => {
    setForm((current) => ({ ...current, departmentId: '' }));
    setDeptSearch('');
    setErrors((current) => ({ ...current, departmentId: '' }));
    if (selectedRegulation) {
      onLoadSubjects(selectedRegulation.id);
    }
  };

  const handleSelectCourse = (courseId: string) => {
    setForm((current) => ({ ...current, courseId, departmentId: '', year: '', semester: '', code: '', name: '', credits: '' }));
    setDeptSearch('');
    setErrors({});
    if (selectedRegulation) {
      onLoadSubjects(selectedRegulation.id);
    }
  };

  const handleSave = async () => {
    setFormErr('');
    setFormMsg('');
    if (!selectedRegulation) return;
    setErrors({});
    if (!validate()) return;
    setSubmitting(true);
    const result = await onSaveSubject({
      subjectId: editingSubject?.id,
      departmentId: form.departmentId,
      courseId: form.courseId,
      year: form.year.trim(),
      semester: form.semester.trim(),
      code: form.code.trim(),
      name: form.name.trim(),
      credits: Number(form.credits),
    });
    setSubmitting(false);
    if (result.ok) {
      setFormMsg(result.message);
      const keptDepartment = form.departmentId;
      setEditingSubject(null);
      setForm((current) => ({ ...current, year: '', semester: '', code: '', name: '', credits: '' }));
      setErrors({});
      if (selectedRegulation) onLoadSubjects(selectedRegulation.id, keptDepartment || undefined);
      window.setTimeout(() => setFormMsg(''), 3500);
    } else {
      setFormErr(result.message);
    }
  };

  const handleReset = () => {
    setForm((current) => ({ ...current, year: '', semester: '', code: '', name: '', credits: '' }));
    setErrors({});
    setFormErr('');
  };

  const startEdit = (subject: SyllabusSubject) => {
    setEditingSubject(subject);
    setForm({ courseId: subject.courseId ?? '', departmentId: subject.departmentId, year: subject.year, semester: subject.semester, code: subject.code, name: subject.name, credits: String(subject.credits) });
    setErrors({});
    setFormErr('');
    setFormMsg('');
    if (selectedRegulation) onLoadSubjects(selectedRegulation.id, subject.departmentId);
    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdit = () => {
    setEditingSubject(null);
    setForm((current) => ({ ...current, year: '', semester: '', code: '', name: '', credits: '' }));
    setErrors({});
    setFormErr('');
  };

  const handleDeleteSubject = async (subject: SyllabusSubject) => {
    const confirmed = window.confirm(`Delete subject "${subject.code} — ${subject.name}"? This cannot be undone.`);
    if (!confirmed) return;
    setFormErr('');
    const result = await onDeleteSubject(subject);
    if (result.ok) {
      setFormMsg(result.message);
      window.setTimeout(() => setFormMsg(''), 3500);
    } else {
      setFormErr(result.message);
    }
  };

  const handleAddRegulation = async () => {
    const name = newRegulation.trim().toUpperCase();
    if (!name) {
      setAddRegErr('Regulation name is required.');
      return;
    }
    if (regulations.some((reg) => reg.name.toUpperCase() === name)) {
      setAddRegErr(`Regulation "${name}" already exists.`);
      return;
    }
    setAddRegErr('');
    const result = await onAddRegulation(name);
    if (result.ok) {
      setAddRegOpen(false);
      setNewRegulation('');
    } else {
      setAddRegErr(result.message);
    }
  };

  const handleDeleteRegulation = async (regulation: RegulationItem) => {
    const confirmed = window.confirm(`Delete regulation "${regulation.name}"? This cannot be undone.`);
    if (!confirmed) return;
    const result = await onDeleteRegulation(regulation);
    if (result.ok) {
      setListErr('');
    } else {
      setListErr(result.message);
    }
  };

  /* ---------------- Regulation selection view ---------------- */
  if (!selectedRegulation) {
    return (
      <div className="space-y-6">
        <div className={card}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">Academic Framework</p>
              <h3 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Syllabus Management</h3>
              <p className={`mt-2 max-w-xl text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Choose a regulation to manage its syllabus — R20, R23, or a new one. Each regulation bundles department-wise subjects for a batch of students.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setNewRegulation(''); setAddRegErr(''); setAddRegOpen(true); }}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Add Regulation
            </button>
          </div>
        </div>

        {listErr ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{listErr}</div> : null}

        {regulationsLoading ? (
          <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>Loading regulations...</div>
        ) : regulations.length === 0 ? (
          <div className={card}>
            <div className={`rounded-2xl border border-dashed p-8 text-center text-sm ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
              {departments.length === 0 ? (
                <FolderOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              ) : (
                <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              )}
              {departments.length === 0
                ? 'No departments are registered yet. Add departments under Courses before managing syllabi.'
                : 'No regulations yet. Click "Add Regulation" to create the first one (e.g. R24).'}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {regulations.map((reg) => (
              <button
                key={reg.id}
                type="button"
                onClick={() => onSelectRegulation(reg)}
                className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition hover:-translate-y-0.5 hover:shadow-xl ${
                  isDark ? 'border-slate-700 bg-slate-900 hover:bg-slate-800' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-gradient-to-br from-amber-300/30 to-amber-500/10 blur-xl" />
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-lg font-bold text-slate-900">
                    {reg.name.replace(/^R/i, '')}
                  </div>
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); handleDeleteRegulation(reg); }}
                    className={`rounded-lg border p-2 text-red-500 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 ${isDark ? 'text-red-400' : ''}`}
                    aria-label={`Delete ${reg.name}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </span>
                </div>
                <div className={`mt-5 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{reg.name}</div>
                <div className="text-sm text-slate-400">Regulation</div>
                <div className={`mt-5 flex items-center gap-4 border-t pt-4 text-xs ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                  <span className="flex items-center gap-1.5"><BookMarked className="h-3.5 w-3.5" /> {reg.subjectCount} {reg.subjectCount === 1 ? 'subject' : 'subjects'}</span>
                  <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> {reg.departments} {reg.departments === 1 ? 'department' : 'departments'}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {addRegOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className={`${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'} w-full max-w-md rounded-2xl p-6 shadow-2xl`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Add Regulation</h3>
                <button type="button" onClick={() => setAddRegOpen(false)} className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddRegulation(); }}>
                <div>
                  <label className={labelClass}>Regulation Name</label>
                  <input autoFocus value={newRegulation} onChange={(e) => setNewRegulation(e.target.value)} placeholder="e.g. R24" className={inputClass} />
                </div>
                {regulations.length > 0 ? (
                  <div>
                    <p className={`mb-1.5 text-xs uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Existing</p>
                    <div>
                      {regulations.map((reg) => (
                        <span key={reg.id} className={`mr-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{reg.name}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {addRegErr ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{addRegErr}</div> : null}
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setAddRegOpen(false)} className={`${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'} rounded-xl border px-4 py-2.5 text-sm font-medium`}>Cancel</button>
                  <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90">Add Regulation</button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  /* ---------------- Syllabus form for a selected regulation ---------------- */
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">Dashboard / Syllabus / {selectedRegulation.name}</p>
          <h3 className={`mt-2 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Syllabus Management</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>
              <BookOpen className="h-3.5 w-3.5" /> {selectedRegulation.name} Regulation
            </span>
            <span className={`hidden rounded-full px-3 py-1 text-xs font-medium sm:inline-flex ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              {selectedDept ? `Department: ${selectedDept.name}` : `${subjects.length} subject${subjects.length === 1 ? '' : 's'}`}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:opacity-80"
          style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Regulations
        </button>
      </div>

      <div ref={formCardRef} className={`${card} scroll-mt-28`}>
        <div className="flex items-center gap-2">
          <BookOpen className={`h-5 w-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {editingSubject ? 'Edit Subject' : 'Add Syllabus Subject'}
          </h4>
        </div>
        <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Select a department, then define its subjects for {selectedRegulation.name}. Subject codes must be unique within a department.
        </p>

        {editingSubject ? (
          <div className={`mt-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            <span>
              Editing <strong>{editingSubject.code}</strong> — {editingSubject.name}
            </span>
            <button type="button" onClick={cancelEdit} className="shrink-0 font-medium underline">Cancel</button>
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {/* Course dropdown */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Select Course</label>
              <select
                value={form.courseId}
                onChange={(e) => handleSelectCourse(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.code} — {course.name}</option>
                ))}
              </select>
            </div>
            {/* Department searchable dropdown */}
          <div>
            <label className={labelClass}>Select Department</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { if (form.courseId) setDeptDropdownOpen((current) => !current); }}
                disabled={!form.courseId}
                className={`${inputClass} flex items-center justify-between text-left ${!form.courseId ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <span className={selectedDept || form.courseId ? '' : `${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {selectedDept
                    ? `${selectedDept.name} (${selectedDept.code})`
                    : form.courseId
                      ? 'Select a Department'
                      : 'Select a Course first'}
                </span>
                <span className="flex items-center gap-1">
                  {selectedDept ? (
                    <span
                      role="button"
                      tabIndex={-1}
                      onClick={(e) => { e.stopPropagation(); clearDept(); }}
                      className={`rounded p-0.5 transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                      aria-label="Show all departments"
                    >
                      <X className="h-4 w-4" />
                    </span>
                  ) : null}
                  <ChevronDown className={`h-4 w-4 transition ${deptDropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                </span>
              </button>

              {deptDropdownOpen ? (
                <div className={`absolute z-30 mt-2 w-full overflow-hidden rounded-xl border shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                  <div className={`flex items-center gap-2 border-b px-3 py-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <Search className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      autoFocus
                      value={deptSearch}
                      onChange={(e) => setDeptSearch(e.target.value)}
                      placeholder="Search departments…"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {courseDepts.length === 0 ? (
                      <div className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{form.courseId ? 'No departments assigned to this course yet. Assign them under Courses.' : 'Select a Course first.'}</div>
                    ) : filteredDepts.length === 0 ? (
                      <div className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No departments match "{deptSearch}".</div>
                    ) : (
                      filteredDepts.map((dept) => (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => handleSelectDept(dept.id)}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${
                            form.departmentId === dept.id
                              ? isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
                              : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>{dept.name} <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>({dept.code})</span></span>
                          {form.departmentId === dept.id ? <Check className="h-4 w-4 text-amber-500" /> : null}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            {errors.departmentId ? <p className={errClass}>{errors.departmentId}</p> : null}
          </div>
          </div>

          {/* Year + semester dropdowns — years come from the selected course's duration */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Year</label>
              <select
                value={form.year}
                onChange={(e) => setForm((current) => ({ ...current, year: e.target.value, semester: '' }))}
                disabled={!form.courseId}
                className={`${inputClass} ${!form.courseId ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <option value="">{form.courseId ? 'Select Year' : 'Select a Course first'}</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{formatOrdinal(y, 'Year')}</option>
                ))}
              </select>
              {errors.year ? <p className={errClass}>{errors.year}</p> : null}
            </div>
            <div>
              <label className={labelClass}>Semester</label>
              <select
                value={form.semester}
                onChange={(e) => setForm((current) => ({ ...current, semester: e.target.value }))}
                disabled={!form.year}
                className={`${inputClass} ${!form.year ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <option value="">{form.year ? 'Select Semester' : 'Select a Year first'}</option>
                {semesterOptions.map((s) => (
                  <option key={s} value={s}>{formatOrdinal(s, 'Semester')}</option>
                ))}
              </select>
              {errors.semester ? <p className={errClass}>{errors.semester}</p> : null}
            </div>
          </div>

          {/* Subject code + name side by side */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Subject Code</label>
              <input value={form.code} onChange={(e) => setForm((current) => ({ ...current, code: e.target.value }))} placeholder="Enter subject code" className={inputClass} />
              {errors.code ? <p className={errClass}>{errors.code}</p> : null}
            </div>
            <div>
              <label className={labelClass}>Subject Name</label>
              <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Enter subject name" className={inputClass} />
              {errors.name ? <p className={errClass}>{errors.name}</p> : null}
            </div>
          </div>

          <div>
            <label className={labelClass}>Subject Credit</label>
            <input value={form.credits} onChange={(e) => setForm((current) => ({ ...current, credits: e.target.value }))} placeholder="Enter credits" inputMode="numeric" className={`${inputClass} max-w-xs`} />
            {errors.credits ? <p className={errClass}>{errors.credits}</p> : null}
          </div>

          {formErr ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formErr}</div> : null}
          {formMsg ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{formMsg}</div> : null}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className={`${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'} rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-slate-50 dark:hover:bg-slate-800`}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="h-4 w-4" /> {editingSubject ? 'Update Subject' : 'Save Subject'}
            </button>
          </div>
        </div>
      </div>

      {/* Existing subjects — grouped into separated Department → Year → Semester sections */}
      <div className={card}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">Existing Subjects</p>
            <h4 className={`mt-2 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedRegulation.name} — {selectedDept ? selectedDept.name : 'All Departments'}</h4>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'}
          </span>
        </div>
        {!selectedDept ? (
          <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Select a department above to update what's shown below. Subjects are grouped by department, year and semester.</p>
        ) : null}

        {subjectsLoading ? (
          <div className={`mt-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div className={`mt-6 rounded-2xl border border-dashed p-8 text-center text-sm ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
            <BookMarked className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            {selectedDept
              ? `No subjects saved in ${selectedDept.name} yet. Use the form above to add the first one.`
              : 'No subjects saved for this regulation yet. Select a department and add subjects using the form above.'}
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {groupedSubjects.map((group) => (
              <section key={group.dept.id} className={`overflow-hidden rounded-2xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                {/* Department header */}
                <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center gap-2">
                    <Layers className={`h-4 w-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <h5 className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>{group.dept.name}{group.dept.code ? ` (${group.dept.code})` : ''}</h5>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    {group.years.reduce((count, y) => count + y.semesters.reduce((c, s) => c + s.subjectsIn.length, 0), 0)} subjects
                  </span>
                </div>

                {/* Year → Semester sub-sections */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.years.map((yearGroup) => (
                    <div key={`${group.dept.id}-${yearGroup.year}`} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <CalendarDays className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        <h6 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{yearGroup.year}</h6>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                          {yearGroup.semesters.reduce((c, s) => c + s.subjectsIn.length, 0)} subjects
                        </span>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {yearGroup.semesters.map((semGroup) => (
                          <div key={`${group.dept.id}-${yearGroup.year}-${semGroup.semester}`} className={`rounded-xl border p-3 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'}`}>
                            <div className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                              <BookOpen className="h-3.5 w-3.5" /> {semGroup.semester}
                            </div>
                            <ul className="space-y-2">
                              {semGroup.subjectsIn.map((sub) => (
                                <li key={sub.id} className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
                                  <div className="min-w-0">
                                    <div className={`truncate font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{sub.name}</div>
                                    <div className={`mt-0.5 flex flex-wrap items-center gap-x-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                      <span className="font-semibold">{sub.code}</span>
                                      <span>· {sub.credits} cred</span>
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => startEdit(sub)}
                                      className={`rounded-lg p-1.5 transition ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                                      aria-label={`Edit ${sub.name}`}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSubject(sub)}
                                      disabled={deletingSubjectId === sub.id}
                                      className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                      aria-label={`Delete ${sub.name}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AttendancePage                                                      */
/* ------------------------------------------------------------------ */

type AttendanceSubject = { id: string; code: string; name: string; semester: string; regulation: { id: string; name: string }; department: { id: string; code: string; name: string } };
type AttendanceStudent = { id: string; rollNumber: string; name: string; collegeId: string; department: string | null };
type AttendanceRegulation = { id: string; name: string };

type AttendancePageProps = {
  role: string;
  regulations: AttendanceRegulation[];
  selectedRegulationId: string;
  subjects: AttendanceSubject[];
  students: AttendanceStudent[];
  records: Record<string, boolean>;
  markedDays: number[];
  selectedDate: Date;
  selectedSubjectId: string;
  loading: boolean;
  saving: boolean;
  msg: string;
  err: string;
  isDark: boolean;
  onSelectDate: (d: Date) => void;
  onSelectSubject: (id: string) => void;
  onSelectRegulation: (id: string) => void;
  onSetRecord: (studentId: string, present: boolean) => void;
  onMarkAll: (present: boolean) => void;
  onRemoveAll: () => void;
  onSave: () => Promise<{ ok: boolean; message: string }>;
  onSetMsg: (m: string) => void;
  onSetErr: (m: string) => void;
  onLoadSubjects: () => void;
  onLoadRegulations: () => void;
  onRefreshMarkedDays: (month: number, year: number) => void;
};

function AttendancePage({
  regulations,
  selectedRegulationId,
  subjects,
  students,
  records,
  markedDays,
  selectedDate,
  selectedSubjectId,
  loading,
  saving,
  msg,
  err,
  isDark,
  onSelectDate,
  onSelectSubject,
  onSelectRegulation,
  onSetRecord,
  onMarkAll,
  onRemoveAll,
  onSave,
  onSetMsg,
  onSetErr,
  onLoadSubjects,
  onLoadRegulations,
  onRefreshMarkedDays,
}: AttendancePageProps) {
  const [calMonth, setCalMonth] = useState(selectedDate.getMonth());
  const [calYear, setCalYear] = useState(selectedDate.getFullYear());

  useEffect(() => {
    onLoadRegulations();
    onLoadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const card = `${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'} rounded-2xl border p-6 shadow-sm`;
  const selectClass = `${isDark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-900'} w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`;

  // Calendar helpers
  const today = new Date();
  const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => {
    const m = calMonth === 0 ? 11 : calMonth - 1;
    const y = calMonth === 0 ? calYear - 1 : calYear;
    setCalMonth(m);
    setCalYear(y);
    onRefreshMarkedDays(m, y);
  };

  const nextMonth = () => {
    const m = calMonth === 11 ? 0 : calMonth + 1;
    const y = calMonth === 11 ? calYear + 1 : calYear;
    setCalMonth(m);
    setCalYear(y);
    onRefreshMarkedDays(m, y);
  };

  const handleDayClick = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    if (d > today) return; // block future dates
    onSelectDate(d);
  };

  const isToday = (day: number) =>
    today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;

  const isSelected = (day: number) =>
    selectedDate.getFullYear() === calYear && selectedDate.getMonth() === calMonth && selectedDate.getDate() === day;

  const isFuture = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d > t;
  };

  const presentCount = Object.values(records).filter((v) => v === true).length;
  const absentCount = Object.values(records).filter((v) => v === false).length;
  const unmarkedCount = students.length - presentCount - absentCount;

  const handleSave = async () => {
    onSetMsg('');
    onSetErr('');
    const result = await onSave();
    if (result.ok) {
      onSetMsg(result.message);
      window.setTimeout(() => onSetMsg(''), 3500);
    } else {
      onSetErr(result.message);
    }
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Academics</p>
          <h3 className={`mt-1 text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Attendance</h3>
        </div>
      </div>

      {/* Regulation + Subject selectors */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className={card}>
          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Select Regulation</label>
          <select
            value={selectedRegulationId}
            onChange={(e) => onSelectRegulation(e.target.value)}
            className={selectClass}
          >
            <option value="">— Select a Regulation —</option>
            {regulations.map((reg) => (
              <option key={reg.id} value={reg.id}>{reg.name}</option>
            ))}
          </select>
        </div>
        <div className={card}>
          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Select Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => onSelectSubject(e.target.value)}
            disabled={!selectedRegulationId}
            className={`${selectClass} ${!selectedRegulationId ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <option value="">{selectedRegulationId ? '— Choose a subject —' : 'Select a Regulation first'}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} — {s.name} ({s.regulation.name})</option>
            ))}
          </select>
        </div>
      </div>

      {selectedSubjectId && (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Calendar */}
          <div className={card}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{monthNames[calMonth]} {calYear}</span>
              <button onClick={nextMonth} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className={`text-center text-xs font-medium py-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const hasRecord = markedDays.includes(day);
                const future = isFuture(day);
                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    disabled={future}
                    className={`relative flex flex-col items-center justify-center py-2 rounded-lg text-sm transition
                      ${future
                        ? isDark ? 'text-slate-700 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed'
                        : isSelected(day)
                          ? 'bg-primary text-white font-semibold shadow'
                          : isToday(day)
                            ? isDark ? 'ring-1 ring-slate-500 text-slate-100' : 'ring-1 ring-slate-300 text-slate-900'
                            : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    {day}
                    {hasRecord && !isSelected(day) && !future && (
                      <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className={`mt-3 flex items-center gap-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Selected</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Marked</span>
            </div>
          </div>

          {/* Student list + controls */}
          <div className={card}>
            {/* Controls bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <span className="font-semibold">{selectedSubject?.code}</span> — {selectedSubject?.name}
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onMarkAll(true)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${isDark ? 'bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/60' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                  Mark All Present
                </button>
                <button onClick={() => onMarkAll(false)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${isDark ? 'bg-red-900/40 text-red-300 hover:bg-red-900/60' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
                  Mark All Absent
                </button>
                <button onClick={() => onRemoveAll()} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${isDark ? 'bg-slate-700/60 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  Remove
                </button>
              </div>
            </div>

            {/* Messages */}
            {msg && <div className="mb-3 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-500">{msg}</div>}
            {err && <div className="mb-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-500">{err}</div>}

            {/* Student table */}
            {loading ? (
              <div className={`py-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading students…</div>
            ) : students.length === 0 ? (
              <div className={`py-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No students found for this subject's department.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className={`min-w-full text-left text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    <thead>
                      <tr className={isDark ? 'border-b border-slate-700 text-slate-400' : 'border-b border-slate-200 text-slate-500'}>
                        <th className="px-3 py-2 font-medium">#</th>
                        <th className="px-3 py-2 font-medium">Roll No</th>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">College ID</th>
                        <th className="px-3 py-2 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, idx) => (
                        <tr key={s.id} className={isDark ? 'border-b border-slate-800' : 'border-b border-slate-100'}>
                          <td className={`px-3 py-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{idx + 1}</td>
                          <td className="px-3 py-2.5 font-mono text-xs">{s.rollNumber}</td>
                          <td className="px-3 py-2.5">{s.name}</td>
                          <td className="px-3 py-2.5">{s.collegeId}</td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="inline-flex items-center gap-1 rounded-lg p-0.5">
                              <button
                                onClick={() => onSetRecord(s.id, true)}
                                className={`rounded-md px-3 py-1 text-xs font-medium transition
                                  ${records[s.id] === true
                                    ? 'bg-emerald-500 text-white shadow'
                                    : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                              >
                                P
                              </button>
                              <button
                                onClick={() => onSetRecord(s.id, false)}
                                className={`rounded-md px-3 py-1 text-xs font-medium transition
                                  ${records[s.id] === false
                                    ? 'bg-red-500 text-white shadow'
                                    : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                              >
                                A
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary + Save */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>Total: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{students.length}</strong></span>
                    <span className="text-emerald-500">Present: <strong>{presentCount}</strong></span>
                    <span className="text-red-500">Absent: <strong>{absentCount}</strong></span>
                    {unmarkedCount > 0 && (
                      <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Unmarked: <strong>{unmarkedCount}</strong></span>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition
                      ${saving ? 'opacity-60 cursor-not-allowed' : ''}
                      bg-primary text-white hover:bg-primary/90 shadow-sm`}
                  >
                    {saving ? 'Saving…' : 'Save Attendance'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type FeesManagerProps = {
  role: string;
  fees: FeeItem[];
  feesLoading: boolean;
  feesError: string;
  categories: FeeCategoryItem[];
  students: FeeStudentItem[];
  isDark: boolean;
  onLoadFees: () => Promise<void>;
  onLoadMeta: () => Promise<void>;
  onAddFee: (payload: { studentId: string; categoryId: string; amount: number; dueDate?: string }) => Promise<{ ok: boolean; message: string }>;
  onDeleteFee: (fee: FeeItem) => Promise<{ ok: boolean; message: string }>;
  deletingFeeId: string | null;
};

function FeesManager({
  role,
  fees,
  feesLoading,
  feesError,
  categories,
  students,
  isDark,
  onLoadFees,
  onLoadMeta,
  onAddFee,
  onDeleteFee,
  deletingFeeId,
}: FeesManagerProps) {
  const isStaff = ['SUPER_ADMIN', 'CHAIRMAN', 'ADMIN', 'EXAM_CELL', 'ACCOUNTANT'].includes(role);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ studentId: '', categoryId: '', amount: '', dueDate: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [formErr, setFormErr] = useState('');
  const [listMsg, setListMsg] = useState('');
  const formCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onLoadFees();
    if (isStaff) onLoadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const card = `${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white'} rounded-2xl border p-6 shadow-sm`;
  const inputClass = `${isDark ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400'} w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10`;
  const labelClass = `mb-2 block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`;
  const errClass = 'mt-1.5 text-sm text-red-600';

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.collegeId.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(studentSearch.toLowerCase()),
  );
  const selectedStudent = students.find((s) => s.id === form.studentId);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!form.studentId) {
      nextErrors.studentId = 'Please select a student.';
    }
    if (!form.amount.trim()) {
      nextErrors.amount = 'Amount is required.';
    } else {
      const amount = Number(form.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        nextErrors.amount = 'Amount must be greater than 0.';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSelectStudent = (studentId: string) => {
    setForm((current) => ({ ...current, studentId }));
    setStudentDropdownOpen(false);
    setStudentSearch('');
    setErrors((current) => ({ ...current, studentId: '' }));
  };

  const handleSelectCategory = (categoryId: string) => {
    setForm((current) => ({ ...current, categoryId }));
    setCategoryDropdownOpen(false);
  };

  const handleSave = async () => {
    setFormErr('');
    setFormMsg('');
    setErrors({});
    if (!validate()) return;
    setSubmitting(true);
    const result = await onAddFee({
      studentId: form.studentId,
      categoryId: form.categoryId,
      amount: Number(form.amount),
      ...(form.dueDate ? { dueDate: form.dueDate } : {}),
    });
    setSubmitting(false);
    if (result.ok) {
      setFormMsg(result.message);
      setForm({ studentId: '', categoryId: '', amount: '', dueDate: '' });
      setErrors({});
      setFormOpen(false);
      window.setTimeout(() => setFormMsg(''), 3500);
    } else {
      setFormErr(result.message);
    }
  };

  const handleDelete = async (fee: FeeItem) => {
    const label = fee.student ? `${fee.student.user.firstName} ${fee.student.user.lastName}`.trim() : 'this student';
    const confirmed = window.confirm(`Delete the ${fee.category?.name ?? 'fee'} entry of ${amountFmt(fee.amount)} for ${label}? This cannot be undone.`);
    if (!confirmed) return;
    const result = await onDeleteFee(fee);
    if (result.ok) {
      setListMsg(result.message);
      window.setTimeout(() => setListMsg(''), 3500);
    } else {
      setListMsg('');
      setFormErr(result.message);
    }
  };

  const isOverdue = (fee: FeeItem): boolean =>
    fee.pendingAmount > 0 && !!fee.dueDate && new Date(fee.dueDate).getTime() < Date.now();

  const statusBadge = (fee: FeeItem) => {
    const status = isOverdue(fee) ? 'OVERDUE' : fee.status;
    const tone =
      status === 'PAID'
        ? 'bg-emerald-100 text-emerald-700'
        : status === 'OVERDUE'
          ? 'bg-red-100 text-red-700'
          : status === 'PARTIALLY_PAID'
            ? 'bg-sky-100 text-sky-700'
            : 'bg-amber-100 text-amber-700';
    return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status.replace(/_/g, ' ')}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header + Add button */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-amber-600'}`}>
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Fee Management</p>
              <h4 className={`mt-1 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isStaff ? 'Student Fee Entries' : 'My Fees'}
              </h4>
            </div>
          </div>
          {isStaff ? (
            <button
              type="button"
              onClick={() => {
                setFormOpen((current) => !current);
                setFormErr('');
                setFormMsg('');
              }}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> {formOpen ? 'Cancel' : 'Add Fee Entry'}
            </button>
          ) : null}
        </div>
        {isStaff ? (
          <p className={`mt-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Create a fee entry for any student. Choose a category, set the amount, and optionally set a due date.
          </p>
        ) : (
          <p className={`mt-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            View the fee entries created for you. Pay at the accounts office to update the status.
          </p>
        )}
      </div>

      {/* Add fee entry form */}
      {formOpen ? (
        <div ref={formCardRef} className={card}>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">New Fee Entry</p>
          <div className="mt-5 space-y-4">
            {/* Student searchable dropdown */}
            <div>
              <label className={labelClass}>Student</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStudentDropdownOpen((current) => !current)}
                  className={`${inputClass} flex items-center justify-between text-left`}
                >
                  <span className={selectedStudent ? '' : `${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {selectedStudent
                      ? `${selectedStudent.name} (${selectedStudent.collegeId}) — ${selectedStudent.rollNumber}`
                      : 'Select a Student'}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition ${studentDropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                </button>
                {studentDropdownOpen ? (
                  <div className={`absolute z-30 mt-2 w-full overflow-hidden rounded-xl border shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                    <div className={`flex items-center gap-2 border-b px-3 py-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <Search className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      <input
                        autoFocus
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Search name, ID or roll number…"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {students.length === 0 ? (
                        <div className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No students registered yet.</div>
                      ) : filteredStudents.length === 0 ? (
                        <div className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No students match "{studentSearch}".</div>
                      ) : (
                        filteredStudents.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => handleSelectStudent(student.id)}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${
                              form.studentId === student.id
                                ? isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
                                : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span>
                              {student.name} <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>— {student.rollNumber}</span>
                              {student.department ? <span className={`ml-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({student.department})</span> : null}
                            </span>
                            {form.studentId === student.id ? <Check className="h-4 w-4 text-amber-500" /> : null}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              {errors.studentId ? <p className={errClass}>{errors.studentId}</p> : null}
            </div>

            {/* Category dropdown */}
            <div>
              <label className={labelClass}>Category</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen((current) => !current)}
                  className={`${inputClass} flex items-center justify-between text-left`}
                >
                  <span className={form.categoryId ? '' : `${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {categories.find((c) => c.id === form.categoryId)?.name ?? 'Optional — Not selected'}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition ${categoryDropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                </button>
                {categoryDropdownOpen ? (
                  <div className={`absolute z-30 mt-2 w-full overflow-hidden rounded-xl border shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                    <div className="max-h-56 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => { setForm((current) => ({ ...current, categoryId: '' })); setCategoryDropdownOpen(false); }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${
                          !form.categoryId
                            ? isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
                            : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>Optional — Not selected</span>
                        {!form.categoryId ? <Check className="h-4 w-4 text-amber-500" /> : null}
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleSelectCategory(category.id)}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${
                            form.categoryId === category.id
                              ? isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
                              : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>{category.name}</span>
                          {form.categoryId === category.id ? <Check className="h-4 w-4 text-amber-500" /> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Amount + due date */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Amount</label>
                <input
                  value={form.amount}
                  onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value }))}
                  placeholder="Enter amount"
                  inputMode="decimal"
                  className={inputClass}
                />
                {errors.amount ? <p className={errClass}>{errors.amount}</p> : null}
              </div>
              <div>
                <label className={labelClass}>Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((current) => ({ ...current, dueDate: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            {formErr ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formErr}</div> : null}
            {formMsg ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{formMsg}</div> : null}

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  setForm({ studentId: '', categoryId: '', amount: '', dueDate: '' });
                  setErrors({});
                  setFormErr('');
                }}
                className={`${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'} rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-slate-50 dark:hover:bg-slate-800`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save className="h-4 w-4" /> {submitting ? 'Saving…' : 'Save Fee Entry'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Fee entries table */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
            {isStaff ? 'All Fee Entries' : 'My Fee Entries'}
          </p>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            {fees.length} {fees.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {feesError ? (
          <div className={`mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700`}>{feesError}</div>
        ) : null}
        {listMsg ? <div className={`mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700`}>{listMsg}</div> : null}

        {feesLoading ? (
          <div className={`mt-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading fee entries...</div>
        ) : fees.length === 0 ? (
          <div className={`mt-6 rounded-2xl border border-dashed p-8 text-center text-sm ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
            <Landmark className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            {isStaff
              ? 'No fee entries yet. Click "Add Fee Entry" to create the first one for a student.'
              : 'No fee entries have been created for you yet.'}
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className={`min-w-full text-left text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              <thead>
                <tr className={isDark ? 'border-b border-slate-700 text-slate-400' : 'border-b border-slate-200 text-slate-500'}>
                  {isStaff ? <th className="px-3 py-2 font-medium">Student</th> : null}
                  {isStaff ? <th className="px-3 py-2 font-medium">Roll No</th> : null}
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 text-right font-medium">Paid</th>
                  <th className="px-3 py-2 text-right font-medium">Pending</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Due Date</th>
                  {isStaff ? <th className="px-3 py-2 text-right font-medium">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => (
                  <tr key={fee.id} className={isDark ? 'border-b border-slate-800' : 'border-b border-slate-100'}>
                    {isStaff ? (
                      <td className="px-3 py-3">
                        <div className="font-medium">{fee.student ? `${fee.student.user.firstName} ${fee.student.user.lastName}`.trim() : '—'}</div>
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{fee.student?.user.collegeId ?? ''}</div>
                      </td>
                    ) : null}
                    {isStaff ? <td className="px-3 py-3">{fee.student?.rollNumber ?? '—'}</td> : null}
                    <td className="px-3 py-3">{fee.category ? fee.category.name : '—'}</td>
                    <td className="px-3 py-3 text-right font-medium">{amountFmt(fee.amount)}</td>
                    <td className="px-3 py-3 text-right">{amountFmt(fee.paidAmount)}</td>
                    <td className="px-3 py-3 text-right">{amountFmt(fee.pendingAmount)}</td>
                    <td className="px-3 py-3">{statusBadge(fee)}</td>
                    <td className="px-3 py-3">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '—'}</td>
                    {isStaff ? (
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDelete(fee)}
                            disabled={deletingFeeId === fee.id}
                            className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Delete fee entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
