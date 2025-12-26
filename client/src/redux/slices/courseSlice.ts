import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  level: string;
  category: string;
  requiredPlan: string;
  instructor: any;
}

interface CourseState {
  courses: Course[];
  currentCourse: any;
  lessons: any[];
  loading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: [],
  currentCourse: null,
  lessons: [],
  loading: false,
  error: null,
};

export const fetchCourses = createAsyncThunk('course/fetchCourses', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/courses');
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch courses');
  }
});

export const fetchCourseById = createAsyncThunk('course/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    const response = await api.get(`/courses/${id}`);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch course');
  }
});

const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.currentCourse = action.payload.course;
        state.lessons = action.payload.lessons;
      });
  },
});

export default courseSlice.reducer;
