import React, { useState, useEffect, useCallback } from 'react'; // react v18.0.0
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'; // react-native v0.70.0
import {
  Button, // Custom button component for navigation and submission
} from '../../../components/ui/Button';
import {
  RadioButton, // Custom radio button component for question options
} from '../../../components/ui/RadioButton';
import {
  ProgressBar, // Custom progress bar component to show assessment completion
} from '../../../components/ui/ProgressBar';
import { useProfile } from '../../../hooks/useProfile';
import {
  PersonalityAssessmentQuestion,
  PersonalityAssessmentSubmission,
} from '../../../types/profile.types';
import { profileApi } from '../../../api/profileApi';
import { useAppDispatch } from '../../../store/hooks';
import { updateAssessmentProgress } from '../../../store/thunks/profileThunks';
import { theme } from '../../../theme';
import {
  AssessmentContainer,
  QuestionContainer,
  QuestionText,
  OptionsContainer,
  NavigationContainer,
} from './PersonalityAssessment.styles';

interface PersonalityAssessmentProps {
  onComplete?: () => void;
  onBack?: () => void;
}

const PersonalityAssessment: React.FC<PersonalityAssessmentProps> = ({ onComplete, onBack }) => {
  const { submitAssessment, loading, error, profileCompletionPercentage } = useProfile();
  const [questions, setQuestions] = useState<PersonalityAssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<{ questionId: string; optionId: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await profileApi.getPersonalityAssessment();
      if (response.success && response.data) {
        setQuestions(response.data);
        setFetchError(null);
      } else {
        setFetchError(response.message || 'Failed to fetch questions');
      }
    } catch (err: any) {
      setFetchError(err.message || 'Failed to fetch questions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleOptionSelect = (optionId: string) => {
    const questionId = questions[currentQuestionIndex].id;
    const newResponses = responses.filter((r) => r.questionId !== questionId);
    setResponses([...newResponses, { questionId, optionId }]);
  };

  const handleNextQuestion = () => {
    if (responses.find((r) => r.questionId === questions[currentQuestionIndex].id)) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      // Optionally show an error message if no option is selected
      console.warn('Please select an option before proceeding.');
    }
  };

  const handlePreviousQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleSubmit = async () => {
    const submissionData: PersonalityAssessmentSubmission = {
      responses: responses.map((r) => ({
        questionId: r.questionId,
        optionId: r.optionId,
      }),
      ),
    };

    try {
      await submitAssessment(submissionData);
      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      setFetchError(err.message || 'Failed to submit assessment');
    }
  };

  const progress = (currentQuestionIndex + 1) / questions.length;

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    dispatch(updateAssessmentProgress(progress));
  }, [progress, dispatch]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.error.main, marginBottom: theme.spacing.md }}>
          Error: {fetchError}
        </Text>
        <Button onPress={fetchQuestions}>Retry</Button>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <AssessmentContainer>
      <QuestionContainer>
        <QuestionText>{currentQuestion.text}</QuestionText>
        <OptionsContainer>
          {currentQuestion.options.map((option) => (
            <RadioButton
              key={option.id}
              label={option.text}
              value={option.id}
              selected={responses.find((r) => r.questionId === currentQuestion.id && r.optionId === option.id) !== undefined}
              onPress={handleOptionSelect}
            />
          ))}
        </OptionsContainer>
      </QuestionContainer>

      <NavigationContainer>
        <Button variant="secondary" onPress={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
          Back
        </Button>
        {isLastQuestion ? (
          <Button onPress={handleSubmit} isLoading={loading}>
            Submit
          </Button>
        ) : (
          <Button onPress={handleNextQuestion} isLoading={loading}>
            Next
          </Button>
        )}
      </NavigationContainer>
    </AssessmentContainer>
  );
};

export default PersonalityAssessment;