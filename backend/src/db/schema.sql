-- Green Valley High School - School Management System
-- Full schema covering all modules in the wireframe.
-- MVP build wires up: users/auth, students, teachers, classes, dashboard.
-- Other tables are included now so later modules (exams, fees, library,
-- hostel, transport, communication) can be built without re-migrating.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========== 0. USERS / AUTH ==========
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','principal','teacher','student','parent')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== 1. CLASSES & SUBJECTS ==========
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,          -- e.g. JSS 1, SS 2
  class_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  capacity INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50),             -- Science, Arts, ICT...
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== 2. STUDENTS ==========
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  admission_no VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  photo_url TEXT,
  class_id INT REFERENCES classes(id) ON DELETE SET NULL,
  date_of_birth DATE,
  gender VARCHAR(10),
  guardian_name VARCHAR(150),
  guardian_phone VARCHAR(30),
  address TEXT,
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active','Inactive','Graduated')),
  enrolled_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== 3. TEACHERS ==========
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  staff_no VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  photo_url TEXT,
  subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
  department VARCHAR(50),
  phone VARCHAR(30),
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  hired_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== 4. TIMETABLE ==========
CREATE TABLE IF NOT EXISTS timetable_slots (
  id SERIAL PRIMARY KEY,
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id INT REFERENCES teachers(id) ON DELETE SET NULL,
  day_of_week VARCHAR(10) NOT NULL,   -- Monday..Friday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- ========== 5. EXAMINATIONS & RESULTS ==========
CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,         -- Mid Term 1, End of Term...
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  max_score INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exam_results (
  id SERIAL PRIMARY KEY,
  exam_id INT REFERENCES exams(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  score NUMERIC(5,2),
  grade VARCHAR(5),
  remarks TEXT,
  UNIQUE(exam_id, student_id)
);

-- ========== 6. FEES & PAYMENTS ==========
CREATE TABLE IF NOT EXISTS fee_structures (
  id SERIAL PRIMARY KEY,
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  term VARCHAR(20) NOT NULL,
  amount NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Paid','Pending','Overdue')),
  paid_at DATE,
  method VARCHAR(30),
  reference VARCHAR(60),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========== 7. LIBRARY ==========
CREATE TABLE IF NOT EXISTS library_books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(150),
  category VARCHAR(50),
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS book_loans (
  id SERIAL PRIMARY KEY,
  book_id INT REFERENCES library_books(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  borrowed_at DATE DEFAULT CURRENT_DATE,
  due_at DATE,
  returned_at DATE
);

-- ========== 8. HOSTEL & TRANSPORTATION ==========
CREATE TABLE IF NOT EXISTS hostel_rooms (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  room_no VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'Checked In'
);

CREATE TABLE IF NOT EXISTS transport_routes (
  id SERIAL PRIMARY KEY,
  route_name VARCHAR(100) NOT NULL,
  vehicle VARCHAR(50),
  driver_name VARCHAR(150),
  status VARCHAR(20) DEFAULT 'Active'
);

-- ========== 9. COMMUNICATION ==========
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_role VARCHAR(20),         -- Principal, Teacher, Parent...
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject VARCHAR(200),
  body TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- ========== 10. ATTENDANCE ==========
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(10) CHECK (status IN ('Present','Absent','Late')),
  UNIQUE(student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_teachers_subject ON teachers(subject_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
