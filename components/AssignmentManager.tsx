
import React from 'react';
import { Book, Assignment, Submission, QuizQuestion } from '../types';
import { supabase } from '../src/lib/supabase';
import { evaluateAnswer, generateQuizForBook, batchGradeAnswers } from '../services/geminiService';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  ArrowLeft,
  BookOpen,
  User,
  Star,
  Sparkles,
  Send,
  Wand2,
  Bell,
  MoreVertical,
  Filter,
  Users,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit,
  Save,
  Loader2,
  Rocket,
  X
} from 'lucide-react';

const MOCK_ASSIGNMENTS_DETAILED: Assignment[] = [
  {
    id: 'asgn-1',
    bookId: '1',
    title: 'Character Analysis: Sparky',
    status: 'published',
    deadline: '2024-05-15',
    createdAt: '2024-05-01',
    assignedStudentIds: ['1', '2', '3', '4', '5'],
    hasDiscussion: true,
    discussionMaxScore: 10,
    submissions: [
      {
        id: 'sub-1',
        studentId: '1',
        studentName: 'Maya Smith',
        submittedAt: '2024-05-12 10:00',
        isReviewed: true,
        totalScore: 95,
        answers: []
      },
      {
        id: 'sub-2',
        studentId: '2',
        studentName: 'Alex Johnson',
        submittedAt: '2024-05-16 14:30',
        isReviewed: false,
        isLate: true,
        answers: [
          { 
            questionId: 'q-1', 
            studentAnswer: 'Sparky felt a sense of belonging because Maya treated him like a real dog, showing that friendship transcends physical forms.' 
          }
        ]
      }
    ]
  },
  {
    id: 'asgn-2',
    bookId: '3',
    title: 'Physics & Gravity Basics',
    status: 'published',
    deadline: '2024-05-25',
    createdAt: '2024-05-10',
    assignedStudentIds: ['1', '2', '3', '4', '5'],
    submissions: []
  }
];

const ROSTER = [
  { id: '1', name: 'Maya Smith' },
  { id: '2', name: 'Alex Johnson' },
  { id: '3', name: 'Liam Brown' },
  { id: '4', name: 'Sophia Davis' },
  { id: '5', name: 'Ethan Hunt' },
];

const AssignmentManager: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'create' | 'track'>('track');
  const [step, setStep] = React.useState<'list' | 'form' | 'build-questions' | 'tracking-view' | 'grading-detail'>('list');
  const [selectedBook, setSelectedBook] = React.useState<Book | null>(null);
  const [selectedAssignment, setSelectedAssignment] = React.useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = React.useState<Submission | null>(null);
  const [gradingFeedback, setGradingFeedback] = React.useState<Record<string, { score: number, feedback: string }>>({});
  const [isEvaluating, setIsEvaluating] = React.useState<string | null>(null);
  const [isBatchGrading, setIsBatchGrading] = React.useState(false);
  const [isPublishingGrade, setIsPublishingGrade] = React.useState(false);
  const [remindedStudents, setRemindedStudents] = React.useState<Set<string>>(new Set());
  const [books, setBooks] = React.useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = React.useState(true);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = React.useState(true);
  const [classes, setClasses] = React.useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = React.useState(true);
  const [students, setStudents] = React.useState<any[]>([]);
  
  // Assignment creation state
  const [assignmentTitle, setAssignmentTitle] = React.useState('');
  const [assignmentDeadline, setAssignmentDeadline] = React.useState('');
  const [assignmentInstructions, setAssignmentInstructions] = React.useState('');
  const [selectedClassId, setSelectedClassId] = React.useState<string>('');
  const [questions, setQuestions] = React.useState<QuizQuestion[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = React.useState<string | null>(null);
  
  // Discussion State
  const [enableDiscussion, setEnableDiscussion] = React.useState(false);
  const [discussionMaxScore, setDiscussionMaxScore] = React.useState(10);
  
  // Auto AI Grading State
  const [enableAutoAIGrading, setEnableAutoAIGrading] = React.useState(false);

  // Fetch books from Supabase
  React.useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('is_active', true)
          .order('title');

        if (error) throw error;

        if (data) {
          const transformedBooks: Book[] = data.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            coverImage: getCoverImageUrl(book.id),
            description: book.description || '',
            fullDescription: book.full_description || book.description || '',
            level: book.lexile_level,
            genre: book.genre || 'Fiction',
            pages: book.page_count || 0,
            estimatedTime: `${Math.ceil((book.page_count || 100) / 30)} min`,
            content: book.description || ''
          }));

          setBooks(transformedBooks);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchBooks();
  }, []);

  // Function to load full submission details with answers
  const loadSubmissionDetails = async (submission: Submission, assignmentId: string) => {
    try {
      console.log('📥 Loading submission details for:', submission.id);
      
      // Fetch the assignment submission with quiz attempt ID
      const { data: submissionData, error: subError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('id', submission.id)
        .single();

      if (subError) {
        console.error('Error fetching submission:', subError);
        throw subError;
      }

      console.log('📦 Full Submission data from DB:', submissionData);

      const attemptId = submissionData.quiz_attempt_id;
      if (!attemptId) {
        console.error('No quiz attempt ID found for submission');
        alert('This submission does not have an associated quiz attempt.');
        return;
      }

      console.log('🎯 Quiz attempt ID:', attemptId);

      // Fetch the quiz answers
      const { data: answersData, error: answersError } = await supabase
        .from('quiz_answers')
        .select('*')
        .eq('attempt_id', attemptId)
        .order('created_at', { ascending: true });

      if (answersError) {
        console.error('Error fetching answers:', answersError);
        throw answersError;
      }

      console.log('📝 Raw Answers data from DB:', answersData);
      console.log('📝 Number of answers:', answersData?.length);
      
      // Log each answer in detail
      answersData?.forEach((ans, idx) => {
        console.log(`Answer ${idx + 1} details:`, {
          id: ans.id,
          attempt_id: ans.attempt_id,
          selected_option_index: ans.selected_option_index,
          answer_text: ans.answer_text,
          is_correct: ans.is_correct,
          points_earned: ans.points_earned
        });
      });

      // Get the assignment to access questions
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) {
        console.error('Assignment not found:', assignmentId);
        return;
      }

      console.log('📚 Assignment questions:', assignment.questions.length);

      // Load the book for this assignment
      const book = books.find(b => b.id === assignment.bookId);
      if (book) {
        setSelectedBook(book);
        console.log('📖 Loaded book:', book.title);
      } else {
        console.warn('⚠️ Book not found for assignment');
      }

      // Map answers to the submission format
      const formattedAnswers = assignment.questions.map((question, index) => {
        const answer = answersData?.[index];
        
        console.log(`Question ${index + 1}:`, {
          type: question.type,
          selectedIndex: answer?.selected_option_index,
          answerText: answer?.answer_text,
          correctIndex: question.correctAnswer
        });
        
        let studentAnswer = 'No answer';
        let studentSelectedIndex = null;
        
        if (question.type === 'multiple-choice') {
          if (answer?.selected_option_index !== null && answer?.selected_option_index !== undefined) {
            studentSelectedIndex = answer.selected_option_index;
            studentAnswer = question.options?.[answer.selected_option_index] || 'Invalid option';
          }
        } else {
          studentAnswer = answer?.answer_text || 'No answer';
        }

        return {
          id: answer?.id, // Include the database ID for updates
          questionId: String(index),
          studentAnswer: studentAnswer,
          studentSelectedIndex: studentSelectedIndex,
          score: answer?.points_earned || answer?.teacher_score,
          feedback: answer?.teacher_feedback || ''
        };
      });

      console.log('✅ Formatted answers:', formattedAnswers);

      // Update the selected submission with answers
      setSelectedSubmission({
        ...submission,
        answers: formattedAnswers
      });
      setStep('grading-detail');
    } catch (error) {
      console.error('Error loading submission details:', error);
      alert('Failed to load submission details');
    }
  };

  // Batch auto-grade all essay and short-answer questions
  const handleBatchAutoGrade = async () => {
    if (!selectedAssignment || !selectedSubmission || !selectedBook) {
      alert('Missing assignment, submission, or book data');
      return;
    }

    try {
      setIsBatchGrading(true);

      // Use book content directly (already loaded with the book)
      const bookContent = selectedBook.content || selectedBook.fullDescription || selectedBook.description || '';
      
      if (!bookContent) {
        console.warn('⚠️ No book content available, grading with limited context');
      }

      console.log('📖 Using book content for grading:', bookContent.substring(0, 200) + '...');

      // Collect all essay/short-answer questions that need grading
      const questionsToGrade = selectedAssignment.questions
        .map((q, idx) => ({
          index: idx,
          question: q,
          answer: selectedSubmission.answers[idx]
        }))
        .filter(item => 
          item.question.type !== 'multiple-choice' && 
          item.answer?.studentAnswer && 
          item.answer.studentAnswer !== 'No answer'
        );

      if (questionsToGrade.length === 0) {
        alert('No essay or short-answer questions to grade!');
        setIsBatchGrading(false);
        return;
      }

      console.log(`🎯 Auto-grading ${questionsToGrade.length} questions...`);

      // Prepare batch grading request
      const gradingRequest = questionsToGrade.map(item => ({
        questionText: item.question.text || item.question.question || 'Question text missing',
        studentAnswer: item.answer.studentAnswer,
        maxPoints: item.question.points || 10,
        questionType: item.question.type as 'short-answer' | 'essay'
      }));

      // Call batch grading API
      const gradingResults = await batchGradeAnswers(
        selectedBook.title,
        bookContent,
        gradingRequest
      );

      console.log('✅ Grading complete:', gradingResults);

      // Update the submission with the new grades and save to database
      const updatedAnswers = [...selectedSubmission.answers];

      for (let i = 0; i < questionsToGrade.length; i++) {
        const item = questionsToGrade[i];
        const result = gradingResults[i];
        
        if (result && updatedAnswers[item.index]) {
          updatedAnswers[item.index] = {
            ...updatedAnswers[item.index],
            score: result.score,
            feedback: result.feedback
          };

          // Save to database
          const answerId = updatedAnswers[item.index].id;
          if (answerId) {
            const { error } = await supabase
              .from('quiz_answers')
              .update({
                teacher_score: result.score,
                teacher_feedback: result.feedback
              })
              .eq('id', answerId);
            
            if (error) {
              console.error('Error updating answer:', error);
            }
          }
        }
      }

      console.log('✅ Saved grades to database');

      setSelectedSubmission({
        ...selectedSubmission,
        answers: updatedAnswers
      });

      alert(`✅ Auto-graded ${gradingResults.length} questions successfully!`);
    } catch (error) {
      console.error('Batch grading failed:', error);
      alert('Auto-grading failed. Please try again or grade manually.');
    } finally {
      setIsBatchGrading(false);
    }
  };

  // Publish grade - mark submission as graded and calculate total score
  const handlePublishGrade = async () => {
    if (!selectedAssignment || !selectedSubmission) {
      alert('Missing assignment or submission data');
      return;
    }

    try {
      setIsPublishingGrade(true);

      // Calculate total score from all answers
      let totalScore = 0;
      let maxScore = 0;

      selectedAssignment.questions.forEach((question, index) => {
        const answer = selectedSubmission.answers[index];
        maxScore += question.points || 10;

        // Check if there's a manually saved score first
        if (answer?.score !== undefined && answer?.score !== null) {
          totalScore += answer.score;
        } else if (question.type === 'multiple-choice') {
          // For multiple choice without manual score, use auto-grade
          const isCorrect = answer?.studentSelectedIndex === question.correctAnswer;
          totalScore += isCorrect ? (question.points || 10) : 0;
        }
        // Essay/short-answer without a score get 0 points
      });

      console.log('📊 Total Score:', totalScore, '/', maxScore);

      // Update the assignment_submission with total score and mark as teacher-graded
      const { error: updateError } = await supabase
        .from('assignment_submissions')
        .update({
          total_score: totalScore,
          grading_status: 'teacher-graded'
        })
        .eq('id', selectedSubmission.id);

      if (updateError) {
        console.error('Error publishing grade:', updateError);
        throw updateError;
      }

      console.log('✅ Grade published successfully');

      // Reload assignments to reflect the updated grade
      await fetchAssignmentsData();

      // Update local state
      setSelectedSubmission({
        ...selectedSubmission,
        score: totalScore
      });

      alert(`✅ Grade published successfully!\n\nScore: ${totalScore}/${maxScore} (${Math.round((totalScore/maxScore) * 100)}%)`);
      
      // Go back to tracking view
      setStep('tracking-view');
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Failed to publish grade:', error);
      alert('Failed to publish grade. Please try again.');
    } finally {
      setIsPublishingGrade(false);
    }
  };

  // Save individual manual grade adjustment
  const handleSaveManualGrade = async (questionIndex: number, score: number, feedback?: string) => {
    if (!selectedSubmission) return;

    try {
      const answer = selectedSubmission.answers[questionIndex];
      const answerId = answer?.id;

      if (!answerId) {
        console.error('Answer ID not found');
        return;
      }

      // Save to database
      const { error } = await supabase
        .from('quiz_answers')
        .update({
          teacher_score: score,
          teacher_feedback: feedback || ''
        })
        .eq('id', answerId);

      if (error) {
        console.error('Error saving manual grade:', error);
        throw error;
      }

      // Update local state
      const updatedAnswers = [...selectedSubmission.answers];
      updatedAnswers[questionIndex] = {
        ...updatedAnswers[questionIndex],
        score: score,
        feedback: feedback || updatedAnswers[questionIndex].feedback
      };

      setSelectedSubmission({
        ...selectedSubmission,
        answers: updatedAnswers
      });

      console.log(`✅ Manual grade saved for question ${questionIndex + 1}`);
    } catch (error) {
      console.error('Failed to save manual grade:', error);
      alert('Failed to save grade. Please try again.');
    }
  };

  // Fetch assignments from Supabase (extracted for reuse)
  const fetchAssignmentsData = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          assignment_students(student_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Fetch all submissions for these assignments
        const assignmentIds = data.map(a => a.id);
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('assignment_submissions')
          .select(`
            *,
            quiz_attempts(
              score,
              completed_at,
              total_possible_points
            )
          `)
          .in('assignment_id', assignmentIds);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
        }

        // Fetch student information for submissions
        const studentIds = submissionsData?.map(s => s.student_id) || [];
        const { data: studentsData, error: studentsError } = await supabase
          .from('users')
          .select('id, email, name')
          .in('id', studentIds);

        if (studentsError) {
          console.error('Error fetching students:', studentsError);
        }

        // Create student lookup map
        const studentMap = new Map(studentsData?.map(s => [s.id, s]) || []);

        const transformedAssignments: Assignment[] = data.map(asgn => {
          // Get submissions for this assignment
          const assignmentSubmissions = submissionsData?.filter(s => s.assignment_id === asgn.id) || [];
          
          const submissions = assignmentSubmissions.map(sub => {
            const student = studentMap.get(sub.student_id);
            const quizAttempt = sub.quiz_attempts?.[0];
            
            return {
              id: sub.id,
              studentId: sub.student_id,
              studentName: student?.name || student?.email || 'Unknown',
              studentEmail: student?.email || '',
              submittedAt: sub.submitted_at || '',
              answers: [], // Will be populated when viewing grading details
              totalScore: quizAttempt?.score || sub.total_score || 0,
              isReviewed: sub.is_reviewed || false,
              isLate: sub.is_late || false,
              teacherComments: sub.teacher_comments || '',
              gradingStatus: sub.grading_status || 'not-graded'
            };
          });

          return {
            id: asgn.id,
            bookId: asgn.book_id,
            classId: asgn.class_id,
            title: asgn.title,
            instructions: asgn.instructions,
            status: asgn.status,
            deadline: asgn.deadline?.split('T')[0] || '',
            createdAt: asgn.created_at,
            assignedStudentIds: asgn.assignment_students?.map((s: any) => s.student_id) || [],
            hasDiscussion: asgn.has_discussion,
            discussionMaxScore: asgn.discussion_max_score,
            enableAutoAIGrading: asgn.enable_auto_ai_grading || false,
            questions: asgn.questions || [],
            totalPoints: asgn.total_points || 0,
            submissions: submissions
          };
        });

        setAssignments(transformedAssignments);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Fetch assignments from Supabase
  React.useEffect(() => {
    const fetchAssignments = async () => {
      await fetchAssignmentsData();
    };

    fetchAssignments();
  }, []);

  // Fetch classes from Supabase
  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        if (data) {
          setClasses(data);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch students from Supabase
  React.useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'student');

        if (error) {
          console.error('Error fetching students:', error);
          throw error;
        }

        if (data) {
          const mappedStudents = data.map(student => ({
            id: student.id,
            name: student.name || student.email?.split('@')[0] || 'Unknown',
            email: student.email
          }));
          setStudents(mappedStudents);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, []);

  const getCoverImageUrl = (bookId: string): string => {
    const { data } = supabase.storage
      .from('book-covers')
      .getPublicUrl(`${bookId}.jpg`);
    
    return data.publicUrl || `https://placehold.co/300x400/6366f1/white?text=Book`;
  };

  const handleAutoGrade = async (qId: string, question: string, answer: string) => {
    setIsEvaluating(qId);
    try {
      const result = await evaluateAnswer(question, answer, selectedBook?.content || "");
      setGradingFeedback(prev => ({ ...prev, [qId]: result }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(null);
    }
  };

  const handleRemind = (studentId: string) => {
    setRemindedStudents(prev => new Set([...prev, studentId]));
  };

  // Question management functions
  const handleGenerateQuestions = async () => {
    if (!selectedBook) return;
    setIsGenerating(true);
    try {
      const generatedQuestions = await generateQuizForBook(selectedBook);
      setQuestions(generatedQuestions);
      console.log('✅ Generated questions:', generatedQuestions);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      text: 'New Question',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      type: 'multiple-choice',
      difficulty: 'medium',
      category: 'recall',
      points: 10
    };
    setQuestions([...questions, newQuestion]);
    setEditingIndex(questions.length);
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const calculateTotalPoints = () => {
    return questions.reduce((sum, q) => sum + (q.points || 0), 0) + (enableDiscussion ? discussionMaxScore : 0);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    // Load the assignment data into the form
    setEditingAssignmentId(assignment.id);
    setAssignmentTitle(assignment.title);
    setAssignmentDeadline(assignment.deadline);
    setAssignmentInstructions(assignment.instructions || '');
    setSelectedClassId(assignment.classId || '');
    setQuestions(assignment.questions || []);
    setEnableAutoAIGrading(assignment.enableAutoAIGrading || false);
    setEnableDiscussion(assignment.discussionMaxScore ? assignment.discussionMaxScore > 0 : false);
    setDiscussionMaxScore(assignment.discussionMaxScore || 10);
    
    // Find and select the book
    const book = books.find(b => b.id === assignment.bookId);
    if (book) {
      setSelectedBook(book);
    }
    
    // Switch to Create tab and go to build questions step if questions exist
    setActiveTab('create');
    if (assignment.questions && assignment.questions.length > 0) {
      setStep('build-questions');
    } else {
      setStep('form');
    }
  };

  const handlePublishAssignment = async () => {
    if (!selectedBook || !assignmentTitle || !assignmentDeadline || questions.length === 0 || !selectedClassId) {
      alert('Please fill in all required fields, add at least one question, and select a class');
      return;
    }

    try {
      const assignmentData = {
        book_id: selectedBook.id,
        class_id: selectedClassId,
        title: assignmentTitle,
        instructions: assignmentInstructions || null,
        deadline: assignmentDeadline,
        questions: questions,
        has_discussion: enableDiscussion,
        discussion_max_score: enableDiscussion ? discussionMaxScore : 0,
        enable_auto_ai_grading: enableAutoAIGrading,
        total_points: calculateTotalPoints(),
        status: 'published',
        updated_at: new Date().toISOString()
      };

      if (editingAssignmentId) {
        // Update existing assignment
        console.log('📝 Updating assignment...');
        
        const { data, error } = await supabase
          .from('assignments')
          .update(assignmentData)
          .eq('id', editingAssignmentId)
          .select()
          .single();

        if (error) {
          console.error('❌ Error updating assignment:', error);
          alert(`Failed to update assignment: ${error.message}`);
          return;
        }

        console.log('✅ Assignment updated:', data);
        alert('Assignment updated successfully!');
        
        // Clear editing state
        setEditingAssignmentId(null);
        
      } else {
        // Create new assignment
        console.log('📋 Publishing new assignment...');

        const newAssignment = {
          ...assignmentData,
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('assignments')
          .insert(newAssignment)
          .select()
          .single();

        if (error) {
          console.error('❌ Error creating assignment:', error);
          alert(`Failed to create assignment: ${error.message}`);
          return;
        }

        console.log('✅ Assignment created:', data);

        // Get students enrolled in the selected class
        const { data: enrollments, error: enrollError } = await supabase
          .from('class_enrollments')
          .select('student_id')
          .eq('class_id', selectedClassId)
          .eq('status', 'active');

        if (enrollError) {
          console.error('⚠️ Error fetching enrollments:', enrollError);
        } else if (enrollments && enrollments.length > 0) {
          // Assign students to the assignment
          const assignmentStudents = enrollments.map(enrollment => ({
            assignment_id: data.id,
            student_id: enrollment.student_id
          }));

        const { error: assignError } = await supabase
          .from('assignment_students')
          .insert(assignmentStudents);

        if (assignError) {
          console.error('⚠️ Error assigning students:', assignError);
        } else {
          console.log(`✅ Assigned ${enrollments.length} students to assignment`);
        }
      }

        alert('Assignment published successfully! 🎉');
      }
      
      // Refresh assignments list with student counts
      const { data: updatedAssignments, error: fetchError } = await supabase
        .from('assignments')
        .select(`
          *,
          assignment_students(student_id)
        `)
        .order('created_at', { ascending: false });

      if (!fetchError && updatedAssignments) {
        const transformedAssignments: Assignment[] = updatedAssignments.map(asgn => ({
          id: asgn.id,
          bookId: asgn.book_id,
          classId: asgn.class_id,
          title: asgn.title,
          instructions: asgn.instructions,
          status: asgn.status,
          deadline: asgn.deadline?.split('T')[0] || '',
          createdAt: asgn.created_at,
          assignedStudentIds: asgn.assignment_students?.map((s: any) => s.student_id) || [],
          hasDiscussion: asgn.has_discussion,
          discussionMaxScore: asgn.discussion_max_score,
          questions: asgn.questions || [],
          totalPoints: asgn.total_points || 0,
          submissions: []
        }));
        setAssignments(transformedAssignments);
      }
      
      // Reset form and switch to track tab
      setActiveTab('track');
      setStep('list');
      setSelectedBook(null);
      setSelectedClassId('');
      setAssignmentTitle('');
      setAssignmentDeadline('');
      setAssignmentInstructions('');
      setQuestions([]);
      setEnableDiscussion(false);
      setEnableAutoAIGrading(false);
      setEditingAssignmentId(null);
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      alert('Failed to publish assignment. Please try again.');
    }
  };

  const getStudentStatus = (studentId: string, assignment: Assignment) => {
    const submission = assignment.submissions?.find(s => s.studentId === studentId);
    if (submission) {
      // Check if graded (has total_score)
      if (submission.totalScore !== undefined && submission.totalScore !== null) {
        const maxScore = assignment.questions?.reduce((sum, q) => sum + (q.points || 10), 0) || 100;
        const percentage = Math.round((submission.totalScore / maxScore) * 100);
        const gradingLabel = submission.gradingStatus === 'ai-graded' ? 'AI-Graded' : 'Teacher-Graded';
        return { 
          label: gradingLabel, 
          color: submission.gradingStatus === 'ai-graded' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600', 
          score: percentage 
        };
      }
      if (submission.isReviewed) return { label: 'Graded', color: 'bg-emerald-50 text-emerald-600', score: submission.totalScore };
      if (submission.isLate) return { label: 'Late', color: 'bg-orange-50 text-orange-600' };
      return { label: 'Submitted', color: 'bg-indigo-50 text-indigo-600' };
    }
    const isPastDeadline = new Date().toISOString().split('T')[0] > assignment.deadline;
    return isPastDeadline 
      ? { label: 'Missing', color: 'bg-rose-50 text-rose-600' }
      : { label: 'Pending', color: 'bg-slate-50 text-slate-500' };
  };

  const renderCreate = () => {
    if (step === 'build-questions') {
      const totalPoints = calculateTotalPoints();
      
      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('form')} className="p-2 hover:bg-slate-100 rounded-full">
                <ArrowLeft size={24} />
              </button>
              <div>
                <h2 className="text-3xl font-black">
                  {editingAssignmentId ? 'Edit Questions' : 'Build Questions'}
                </h2>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{assignmentTitle}</p>
                {editingAssignmentId && (
                  <span className="inline-block mt-1 text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">
                    Editing Mode
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Points: </span>
                <span className="text-lg font-black text-indigo-600">{totalPoints}</span>
              </div>
              <button 
                onClick={handlePublishAssignment}
                disabled={questions.length === 0}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {editingAssignmentId ? <Edit size={18} /> : <Rocket size={18} />}
                {editingAssignmentId ? 'Update Assignment' : 'Publish Assignment'}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Question List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex gap-3">
                <button 
                  onClick={handleGenerateQuestions}
                  disabled={isGenerating}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} />
                      AI Generate Questions
                    </>
                  )}
                </button>
                <button 
                  onClick={addQuestion}
                  className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Question
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="bg-white p-20 rounded-[3.5rem] border border-slate-100 shadow-sm text-center">
                  <ClipboardList size={48} className="text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-slate-900 mb-2">No Questions Yet</h3>
                  <p className="text-sm text-slate-500 font-medium">Use AI to generate questions or add them manually</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div 
                      key={index}
                      className={`bg-white p-6 rounded-[2rem] border shadow-sm transition-all ${editingIndex === index ? 'border-indigo-600 shadow-xl' : 'border-slate-100'}`}
                    >
                      {editingIndex === index ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Question {index + 1}</span>
                            <button 
                              onClick={() => setEditingIndex(null)}
                              className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-xl transition-all"
                            >
                              <Save size={18} />
                            </button>
                          </div>
                          <textarea 
                            value={q.text}
                            onChange={(e) => updateQuestion(index, { text: e.target.value })}
                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-50 transition-all min-h-[100px]"
                            placeholder="Enter your question..."
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Question Type</label>
                              <select 
                                value={q.type}
                                onChange={(e) => updateQuestion(index, { type: e.target.value as any })}
                                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black text-slate-900"
                              >
                                <option value="multiple-choice">Multiple Choice</option>
                                <option value="short-answer">Short Answer</option>
                                <option value="essay">Essay</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Points</label>
                              <input 
                                type="number"
                                value={q.points || 10}
                                onChange={(e) => updateQuestion(index, { points: parseInt(e.target.value) })}
                                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black text-slate-900"
                              />
                            </div>
                          </div>

                          {q.type === 'multiple-choice' && (
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Answer Choices</label>
                              {q.options?.map((opt, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-3">
                                  <input 
                                    type="radio"
                                    checked={q.correctAnswer === optIndex}
                                    onChange={() => updateQuestion(index, { correctAnswer: optIndex })}
                                    className="w-5 h-5 text-indigo-600"
                                  />
                                  <input 
                                    value={opt}
                                    onChange={(e) => {
                                      const newOptions = [...(q.options || [])];
                                      newOptions[optIndex] = e.target.value;
                                      updateQuestion(index, { options: newOptions });
                                    }}
                                    className="flex-1 bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-900"
                                    placeholder={`Option ${optIndex + 1}`}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Question {index + 1}</span>
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                                  q.type === 'multiple-choice' ? 'bg-blue-50 text-blue-600' :
                                  q.type === 'short-answer' ? 'bg-amber-50 text-amber-600' :
                                  'bg-purple-50 text-purple-600'
                                }`}>
                                  {q.type === 'multiple-choice' ? 'MCQ' : q.type === 'short-answer' ? 'Short Answer' : 'Essay'}
                                </span>
                                <span className="ml-auto text-indigo-600 font-black">{q.points || 10} pts</span>
                              </div>
                              <p className="font-bold text-slate-900">{q.text}</p>
                              {q.type === 'multiple-choice' && (
                                <div className="mt-3 space-y-2">
                                  {q.options?.map((opt, optIndex) => (
                                    <div key={optIndex} className="flex items-center gap-2 text-sm">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${q.correctAnswer === optIndex ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                                        {q.correctAnswer === optIndex && <CheckCircle2 size={14} className="text-emerald-600" />}
                                      </div>
                                      <span className={q.correctAnswer === optIndex ? 'font-bold text-slate-900' : 'text-slate-600'}>{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setEditingIndex(index)}
                                className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={() => deleteQuestion(index)}
                                className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assignment Summary */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                    <ClipboardList size={24} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Summary</h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Book</p>
                    <p className="font-black text-slate-900">{selectedBook?.title}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Questions</p>
                    <p className="font-black text-2xl text-slate-900">{questions.length}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Question Breakdown</p>
                    <div className="space-y-2 mt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 font-bold">Multiple Choice</span>
                        <span className="font-black text-slate-900">{questions.filter(q => q.type === 'multiple-choice').length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 font-bold">Short Answer</span>
                        <span className="font-black text-slate-900">{questions.filter(q => q.type === 'short-answer').length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 font-bold">Essay</span>
                        <span className="font-black text-slate-900">{questions.filter(q => q.type === 'essay').length}</span>
                      </div>
                    </div>
                  </div>

                  {enableDiscussion && (
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={16} className="text-indigo-600" />
                        <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Discussion Board</p>
                      </div>
                      <p className="text-sm font-bold text-slate-700">+{discussionMaxScore} participation points</p>
                    </div>
                  )}

                  {/* Auto AI Grading Toggle */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-600" />
                        <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest">Auto AI Grading</p>
                      </div>
                      <button 
                        onClick={() => setEnableAutoAIGrading(!enableAutoAIGrading)} 
                        className="text-purple-600 transition-all"
                      >
                        {enableAutoAIGrading ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-slate-300" />}
                      </button>
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {enableAutoAIGrading 
                        ? 'Essays auto-graded on submit ✨' 
                        : 'Manual grading required'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="text-indigo-400" />
                  <h3 className="text-lg font-black">AI Tips</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-sm font-medium leading-relaxed">
                    {questions.length === 0 
                      ? "Start by generating questions with AI for instant scaffolding based on the book's content."
                      : questions.filter(q => q.type === 'essay').length > 2
                      ? "You have multiple essay questions. Consider balancing with more MCQs for quicker student feedback."
                      : "Great mix! Your assignment balances auto-graded and teacher-graded questions."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (step === 'form') {
      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
          <div className="flex items-center gap-4">
            <button onClick={() => {
              setStep('list');
              if (editingAssignmentId) {
                // Clear edit mode when going back
                setEditingAssignmentId(null);
                setAssignmentTitle('');
                setAssignmentDeadline('');
                setAssignmentInstructions('');
                setQuestions([]);
                setSelectedBook(null);
                setSelectedClassId('');
              }
            }} className="p-2 hover:bg-slate-100 rounded-full">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-3xl font-black">
                {editingAssignmentId ? 'Edit Mission' : 'Create Mission'}
              </h2>
              {editingAssignmentId && (
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mt-1">
                  Editing existing assignment
                </p>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <img src={selectedBook?.coverImage} className="w-16 h-24 rounded-2xl object-cover shadow-lg" />
                <div>
                  <p className="font-black text-slate-900">{selectedBook?.title}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase">{selectedBook?.author}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Mission Title</label>
                  <input 
                    type="text" 
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="e.g. Deep Comprehension - Ch. 1-3" 
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-50 transition-all" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Deadline</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="date" 
                        value={assignmentDeadline}
                        onChange={(e) => setAssignmentDeadline(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-900" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Class</label>
                    <select 
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black text-slate-900"
                    >
                      <option value="">Select a class...</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} {cls.grade_level ? `(${cls.grade_level})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Instructions (Optional)</label>
                  <textarea 
                    value={assignmentInstructions}
                    onChange={(e) => setAssignmentInstructions(e.target.value)}
                    placeholder="Add specific instructions or context for this assignment..."
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-50 transition-all min-h-[100px]"
                  />
                </div>

                {/* Discussion Board Settings */}
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${enableDiscussion ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">Enable Discussion Board</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collaborative reading thread</p>
                      </div>
                    </div>
                    <button onClick={() => setEnableDiscussion(!enableDiscussion)} className="text-indigo-600 transition-all">
                      {enableDiscussion ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-300" />}
                    </button>
                  </div>

                  {enableDiscussion && (
                    <div className="pt-4 border-t border-slate-200 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Graded Participation Max Points</label>
                        <input 
                          type="number" 
                          value={discussionMaxScore}
                          onChange={(e) => setDiscussionMaxScore(parseInt(e.target.value))}
                          className="w-20 bg-white border-none rounded-xl py-2 px-3 text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500" 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Auto AI Grading Settings */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-[2rem] border-2 border-purple-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${enableAutoAIGrading ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">Enable Auto AI Grading</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instant AI feedback on submission</p>
                      </div>
                    </div>
                    <button onClick={() => setEnableAutoAIGrading(!enableAutoAIGrading)} className="text-purple-600 transition-all">
                      {enableAutoAIGrading ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-300" />}
                    </button>
                  </div>

                  {enableAutoAIGrading && (
                    <div className="pt-4 border-t border-purple-200 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 text-purple-700">
                        <Sparkles size={14} />
                        <p className="text-xs font-bold">Essays and short answers will be auto-graded using AI when students submit. Teachers can review and adjust grades afterward.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Assignment Type</label>
                  <div className="flex gap-2">
                    {['Individual', 'Group', 'Full Class'].map(type => (
                      <button key={type} className={`px-4 py-2 rounded-xl text-xs font-black uppercase border-2 transition-all ${type === 'Full Class' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-100 text-slate-500'}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setStep('build-questions')}
                disabled={!assignmentTitle || !assignmentDeadline}
                className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ClipboardList size={20} />
                Build Questions
              </button>
            </div>

            <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
               <div className="flex items-center gap-3 mb-8">
                 <Sparkles className="text-indigo-400" />
                 <h3 className="text-xl font-black">Gemini Assistant</h3>
               </div>
               <div className="space-y-6">
                 <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                   <p className="text-sm font-medium leading-relaxed">I've analyzed the complexity of <span className="text-indigo-400">"{selectedBook?.title}"</span>. {enableDiscussion ? 'Discussion boards improve retention by 25% for this genre.' : 'Consider adding a discussion board to boost class engagement.'}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                     <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Target Skill</p>
                     <p className="text-sm font-bold text-white">Inference</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                     <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Difficulty</p>
                     <p className="text-sm font-bold text-white">Adaptive</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-slate-900">Select Reading Source</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search books..." className="bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm w-64 shadow-sm text-slate-900 font-bold" />
          </div>
        </div>

        {loadingBooks ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading books...</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map(book => (
              <button 
                key={book.id} 
                onClick={() => { setSelectedBook(book); setStep('form'); }}
                className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-left"
              >
                <div className="aspect-[3/4] rounded-[2rem] overflow-hidden mb-6 relative">
                  <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black text-indigo-600 shadow-sm">
                    {book.level}L
                  </div>
              </div>
              <h3 className="font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">{book.title}</h3>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-wider">{book.genre}</p>
            </button>
          ))}
        </div>
        )}
      </div>
    );
  };

  const renderTrack = () => {
    if (step === 'grading-detail' && selectedSubmission) {
      return (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('tracking-view')} className="p-2 hover:bg-slate-100 rounded-full">
                <ArrowLeft size={24} className="text-slate-600" />
              </button>
              <div>
                <h2 className="text-3xl font-black text-slate-900">{selectedSubmission.studentName}</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  Submission for: {selectedAssignment?.title}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleBatchAutoGrade}
                disabled={isBatchGrading}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBatchGrading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Grading...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Auto-Grade All
                  </>
                )}
              </button>
              <button 
                onClick={handlePublishGrade}
                disabled={isPublishingGrade}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPublishingGrade ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Publish Grade
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
               <div className={`p-3 rounded-2xl bg-indigo-50 text-indigo-600`}>
                 <ClipboardList size={24} />
               </div>
               <h3 className="text-xl font-black text-slate-900">Student Response</h3>
             </div>
             {selectedAssignment?.questions.map((question, i) => {
               const answer = selectedSubmission.answers[i];
               
               console.log(`Rendering Question ${i + 1}:`, {
                 questionText: question.text || question.question,
                 type: question.type,
                 studentAnswer: answer?.studentAnswer,
                 studentSelectedIndex: answer?.studentSelectedIndex,
                 correctIndex: question.correctAnswer,
                 hasAnswer: !!answer
               });
               
               const isCorrect = question.type === 'multiple-choice' && 
                                question.options && 
                                question.correctAnswer !== undefined &&
                                answer?.studentSelectedIndex === question.correctAnswer;
               
               return (
                 <div key={i} className="space-y-6 mb-10 pb-10 border-b border-slate-100 last:border-0">
                   <div className="flex items-start justify-between gap-4">
                     <div className="flex-1">
                       <div className="flex items-center gap-3 mb-4">
                         <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">
                           QUESTION {i + 1}
                         </span>
                         <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                           {question.type === 'multiple-choice' ? 'Multiple Choice' : 
                            question.type === 'short-answer' ? 'Short Answer' : 'Essay'}
                         </span>
                       </div>
                       {(question.text || question.question) ? (
                         <p className="text-xl font-bold text-slate-900 mb-2 leading-relaxed">{question.text || question.question}</p>
                       ) : (
                         <p className="text-xl font-bold text-rose-600 mb-2">⚠️ Question text missing</p>
                       )}
                     </div>
                     <div className="text-right">
                       <span className="text-sm font-black text-slate-500">{question.points || 0} pts</span>
                     </div>
                   </div>

                   {question.type === 'multiple-choice' && question.options && (
                     <div className="space-y-3">
                       <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Answer Choices:</p>
                       {answer?.studentSelectedIndex === undefined && answer?.studentAnswer && (
                         <div className="bg-yellow-50 border border-yellow-300 p-3 rounded-xl mb-2">
                           <p className="text-xs font-bold text-yellow-800">
                             ⚠️ Student's answer: "{answer.studentAnswer}" (matching by text)
                           </p>
                         </div>
                       )}
                       <div className="space-y-2">
                         {question.options.map((option, optIdx) => {
                           // Check if this is the student's selected answer by index OR text
                           const isStudentChoiceByIndex = answer?.studentSelectedIndex === optIdx;
                           const isStudentChoiceByText = answer?.studentAnswer === option;
                           const isStudentChoice = isStudentChoiceByIndex || (answer?.studentSelectedIndex === undefined && isStudentChoiceByText);
                           const isCorrectAnswer = optIdx === question.correctAnswer;
                           
                           return (
                             <div 
                               key={optIdx}
                               className={`p-4 rounded-xl border-2 flex items-center gap-3 ${
                                 isCorrectAnswer && isStudentChoice
                                   ? 'bg-emerald-50 border-emerald-500' 
                                   : isCorrectAnswer 
                                     ? 'bg-emerald-50 border-emerald-300'
                                     : isStudentChoice 
                                       ? 'bg-rose-50 border-rose-500' 
                                       : 'bg-slate-50 border-slate-200'
                               }`}
                             >
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                                 isCorrectAnswer && isStudentChoice
                                   ? 'bg-emerald-500 text-white' 
                                   : isCorrectAnswer 
                                     ? 'bg-emerald-400 text-white'
                                     : isStudentChoice 
                                       ? 'bg-rose-500 text-white' 
                                       : 'bg-slate-200 text-slate-600'
                               }`}>
                                 {String.fromCharCode(65 + optIdx)}
                               </div>
                               <p className={`flex-1 font-medium ${
                                 isCorrectAnswer || isStudentChoice ? 'text-slate-900 font-bold' : 'text-slate-600'
                               }`}>
                                 {option}
                               </p>
                               {isStudentChoice && isCorrectAnswer && (
                                 <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                                   <CheckCircle2 size={12} /> STUDENT CORRECT
                                 </span>
                               )}
                               {isCorrectAnswer && !isStudentChoice && (
                                 <span className="bg-emerald-400 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                                   <CheckCircle2 size={12} /> CORRECT ANSWER
                                 </span>
                               )}
                               {isStudentChoice && !isCorrectAnswer && (
                                 <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                                   <X size={12} /> STUDENT CHOICE
                                 </span>
                               )}
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}

                   {question.type !== 'multiple-choice' && (
                     <div className="bg-indigo-50 p-6 rounded-2xl">
                       <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Student's Answer:</p>
                       <p className="text-slate-900 font-medium whitespace-pre-wrap">{answer?.studentAnswer || 'No answer provided'}</p>
                     </div>
                   )}

                   {question.type === 'multiple-choice' && (
                     <div className="space-y-4">
                       <div className="bg-white p-4 rounded-xl border-2 border-slate-200">
                         <div className="flex items-center justify-between">
                           <span className="text-sm font-bold text-slate-700">
                             {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                           </span>
                           <span className="text-lg font-black text-slate-900">
                             {isCorrect ? question.points : 0} / {question.points} pts
                           </span>
                         </div>
                       </div>
                       
                       {/* Allow manual grade adjustment */}
                       <div className="grid sm:grid-cols-2 gap-6">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">
                             Adjust Grade (out of {question.points})
                           </label>
                           <input 
                             id={`mcq-grade-${i}`}
                             type="number" 
                             max={question.points}
                             min={0}
                             className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-black text-slate-900 placeholder-slate-400" 
                             placeholder={`Score 0-${question.points}`}
                             defaultValue={isCorrect ? question.points : 0}
                           />
                         </div>
                         <div className="flex items-end">
                           <button 
                             onClick={() => {
                               const input = document.getElementById(`mcq-grade-${i}`) as HTMLInputElement;
                               const score = parseFloat(input?.value || '0');
                               if (score >= 0 && score <= (question.points || 10)) {
                                 handleSaveManualGrade(i, score);
                               } else {
                                 alert(`Score must be between 0 and ${question.points}`);
                               }
                             }}
                             className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                           >
                             <Save size={18} />
                             Save Grade
                           </button>
                         </div>
                       </div>
                     </div>
                   )}

                   {question.type !== 'multiple-choice' && (
                     <div className="space-y-4">
                       {/* AI Grading Result */}
                       {answer?.feedback && (
                         <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl border-2 border-purple-200">
                           <div className="flex items-center gap-2 mb-3">
                             <Sparkles size={18} className="text-purple-600" />
                             <p className="text-xs font-black text-purple-600 uppercase tracking-widest">AI Grading Result</p>
                           </div>
                           <div className="flex items-center justify-between mb-4">
                             <span className="text-2xl font-black text-slate-900">
                               {answer.score} / {question.points} pts
                             </span>
                             <span className="text-sm font-bold text-purple-600">
                               {Math.round((answer.score / question.points) * 100)}%
                             </span>
                           </div>
                           <div className="bg-white/70 p-4 rounded-xl">
                             <p className="text-xs font-bold text-slate-600 mb-2">Feedback:</p>
                             <p className="text-slate-700 text-sm whitespace-pre-wrap">{answer.feedback}</p>
                           </div>
                         </div>
                       )}

                       {/* Manual Grading Controls */}
                       <div className="grid sm:grid-cols-2 gap-6">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">
                             {answer?.feedback ? 'Adjust Grade' : 'Grade'} (out of {question.points})
                           </label>
                           <input 
                             id={`essay-grade-${i}`}
                             type="number" 
                             max={question.points}
                             min={0}
                             className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-black text-slate-900 placeholder-slate-400" 
                             placeholder={`Score 0-${question.points}`}
                             defaultValue={answer?.score}
                           />
                         </div>
                         <div className="flex items-end">
                           <button 
                             onClick={() => {
                               const input = document.getElementById(`essay-grade-${i}`) as HTMLInputElement;
                               const score = parseFloat(input?.value || '0');
                               if (score >= 0 && score <= (question.points || 10)) {
                                 handleSaveManualGrade(i, score);
                               } else {
                                 alert(`Score must be between 0 and ${question.points}`);
                               }
                             }}
                             className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                           >
                             <Save size={18} />
                             Save Grade
                           </button>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               );
             })}
          </div>
        </div>
      );
    }

    if (step === 'tracking-view' && selectedAssignment) {
      const book = books.find(b => b.id === selectedAssignment.bookId);
      const submissionCount = selectedAssignment.submissions?.length || 0;
      const totalCount = selectedAssignment.assignedStudentIds.length || 0;
      const progress = totalCount > 0 ? (submissionCount / totalCount) * 100 : 0;
      
      // Filter students who are assigned to this assignment
      const assignedStudents = students.filter(student => 
        selectedAssignment.assignedStudentIds.includes(student.id)
      );

      return (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('list')} className="p-2 hover:bg-slate-100 rounded-full">
                <ArrowLeft size={24} className="text-slate-600" />
              </button>
              <div>
                <h2 className="text-3xl font-black text-slate-900">{selectedAssignment.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target: {book?.title}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Deadline: {selectedAssignment.deadline}</span>
                  {selectedAssignment.totalPoints && (
                    <>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{selectedAssignment.totalPoints} Total Points</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
               <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                 <ClipboardList className="text-indigo-600" size={18} />
                 <span className="text-sm font-black text-slate-700">{selectedAssignment.questions?.length || 0} Questions</span>
               </div>
               {totalCount > 0 && (
                 <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                   <Users className="text-indigo-600" size={18} />
                   <span className="text-sm font-black text-slate-700">{submissionCount}/{totalCount} Completed</span>
                 </div>
               )}
            </div>
          </div>

          {/* Assignment Details Card */}
          {selectedAssignment.instructions && (
            <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-4">Instructions</h3>
              <p className="text-slate-700 font-medium leading-relaxed">{selectedAssignment.instructions}</p>
            </div>
          )}

          {/* Questions Preview */}
          {selectedAssignment.questions && selectedAssignment.questions.length > 0 && (
            <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6">Assignment Questions</h3>
              <div className="space-y-4">
                {selectedAssignment.questions.map((q, index) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Q{index + 1}</span>
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                          q.type === 'multiple-choice' ? 'bg-blue-50 text-blue-600' :
                          q.type === 'short-answer' ? 'bg-amber-50 text-amber-600' :
                          'bg-purple-50 text-purple-600'
                        }`}>
                          {q.type === 'multiple-choice' ? 'MCQ' : q.type === 'short-answer' ? 'Short Answer' : 'Essay'}
                        </span>
                      </div>
                      <span className="text-indigo-600 font-black text-sm">{q.points || 0} pts</span>
                    </div>
                    <p className="font-bold text-slate-900">{q.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalCount > 0 ? (
            <>
              <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                   <span>Submission Progress</span>
                   <span className="text-indigo-600 font-bold">{Math.round(progress)}%</span>
                 </div>
                 <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                   <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                 </div>
              </div>

              <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Submitted At</th>
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Grade</th>
                    <th className="px-10 py-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {assignedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-10 py-20 text-center">
                        <Users size={48} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">No students assigned to this assignment</p>
                        <p className="text-xs text-slate-400 mt-2">Students are auto-assigned based on class enrollment</p>
                      </td>
                    </tr>
                  ) : (
                    assignedStudents.map(student => {
                      const status = getStudentStatus(student.id, selectedAssignment);
                      const submission = selectedAssignment.submissions?.find(s => s.studentId === student.id);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                                {student.name.charAt(0)}
                              </div>
                              <span className="font-black text-slate-900">{student.name}</span>
                            </div>
                        </td>
                        <td className="px-10 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                          <span className="text-sm font-bold text-slate-500">
                            {submission?.submittedAt || (status.label === 'Missing' ? 'Never' : '—')}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                           <span className="font-black text-slate-900 text-lg">
                             {status.score !== undefined ? `${status.score}%` : '—'}
                           </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex justify-end gap-2">
                             {(status.label === 'Missing' || status.label === 'Late' || status.label === 'Pending') && (
                               <button 
                                onClick={() => handleRemind(student.id)}
                                className={`p-2 rounded-xl transition-all ${remindedStudents.has(student.id) ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                title="Send Reminder"
                               >
                                 {remindedStudents.has(student.id) ? <CheckCircle2 size={18} /> : <Bell size={18} />}
                               </button>
                             )}
                             {(status.label === 'Submitted' || status.label === 'Late' || status.label === 'Graded') && submission && (
                               <button 
                                onClick={() => loadSubmissionDetails(submission, selectedAssignment.id)}
                                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                               >
                                 {status.label === 'Graded' ? 'View' : 'Review'}
                               </button>
                             )}
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
            </>
          ) : (
            <div className="bg-white p-20 rounded-[3.5rem] border border-slate-100 shadow-sm text-center">
              <Users size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-900 mb-2">No Students Assigned</h3>
              <p className="text-sm text-slate-500 font-medium">Assign this to a class to start tracking submissions</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h2 className="text-3xl font-black text-slate-900">Active Missions</h2>
          <div className="flex gap-3">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Filter missions..." className="bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm w-64 shadow-sm text-slate-900 font-bold" />
             </div>
             <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-sm transition-all">
               <Filter size={18} />
             </button>
          </div>
        </div>

        {loadingAssignments ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white p-20 rounded-[3.5rem] border border-slate-100 shadow-sm text-center">
            <ClipboardList size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">No Assignments Yet</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">Create your first assignment to start tracking student progress</p>
            <button 
              onClick={() => {
                setEditingAssignmentId(null);
                setActiveTab('create');
                setStep('list');
              }}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Create Assignment
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {assignments.map(asgn => {
              const book = books.find(b => b.id === asgn.bookId);
              const assignmentClass = classes.find(c => c.id === asgn.classId);
              const subCount = asgn.submissions?.length || 0;
              const totalCount = asgn.assignedStudentIds.length || 0;
              const progress = totalCount > 0 ? (subCount / totalCount) * 100 : 0;
              const isPastDeadline = new Date().toISOString().split('T')[0] > asgn.deadline;

              return (
                <div 
                  key={asgn.id}
                  className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row md:items-center gap-8"
                >
                <div className="w-16 h-20 bg-slate-50 rounded-2xl overflow-hidden shrink-0 shadow-sm cursor-pointer"
                     onClick={() => { setSelectedAssignment(asgn); setStep('tracking-view'); }}>
                  <img src={book?.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                
                <div className="flex-1 space-y-2 cursor-pointer"
                     onClick={() => { setSelectedAssignment(asgn); setStep('tracking-view'); }}>
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">{asgn.title}</h3>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isPastDeadline ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {isPastDeadline ? 'Deadline Passed' : 'Active'}
                      </span>
                      {asgn.hasDiscussion && (
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 flex items-center gap-1">
                          <MessageSquare size={10} />
                          Discussion
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> Due {asgn.deadline}</span>
                    {assignmentClass && (
                      <span className="flex items-center gap-1.5"><Users size={14} /> {assignmentClass.name}</span>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-48 space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                    <span>{subCount}/{totalCount} Done</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditAssignment(asgn);
                  }}
                  className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit
                </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Assignment Lab</h1>
          <p className="text-slate-600 font-medium mt-1">Design reading missions and track class-wide breakthroughs.</p>
        </div>
        <div className="bg-slate-100 p-1.5 rounded-2xl flex">
          <button 
            onClick={() => { 
              setEditingAssignmentId(null);
              setActiveTab('create'); 
              setStep('list'); 
            }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Create
          </button>
          <button 
            onClick={() => { setActiveTab('track'); setStep('list'); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'track' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Track & Grade
          </button>
        </div>
      </div>

      {activeTab === 'create' ? renderCreate() : renderTrack()}
    </div>
  );
};

export default AssignmentManager;
