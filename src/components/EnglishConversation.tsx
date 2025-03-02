import React, { useState, useEffect, useCallback } from 'react';
import { FaMicrophone, FaStop, FaTimes, FaRedo } from 'react-icons/fa';
import OpenAI from 'openai';
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam } from 'openai/resources/chat';
import styled from '@emotion/styled';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  language?: 'en' | 'ja';
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '2rem auto',
    padding: '2.5rem',
    borderRadius: '24px',
    background: 'linear-gradient(145deg, #ffffff, #f5f7fa)',
    boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
    '@media (max-width: 768px)': {
      margin: '0',
      padding: '1.5rem',
      borderRadius: '0',
    }
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '3rem',
    '& h1': {
      fontSize: '2.5rem',
      background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent',
      marginBottom: '0.75rem',
      fontWeight: '700',
      '@media (max-width: 768px)': {
        fontSize: '1.75rem',
      }
    },
    '& p': {
      color: '#6B7280',
      fontSize: '1.1rem',
      letterSpacing: '0.5px',
      '@media (max-width: 768px)': {
        fontSize: '0.95rem',
      }
    }
  },
  messageContainer: {
    display: 'flex',
    flexDirection: 'column-reverse' as const,
    gap: '1rem',
    height: '450px',
    overflowY: 'auto' as const,
    padding: '1.5rem',
    marginBottom: '2rem',
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(229, 231, 235, 0.5)',
    '@media (max-width: 768px)': {
      height: '400px',
      padding: '1rem',
    }
  },
  transcriptBox: {
    padding: '1.25rem',
    borderRadius: '12px',
    background: 'rgba(249, 250, 251, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(229, 231, 235, 0.5)',
    marginBottom: '1.5rem',
    transition: 'all 0.3s ease',
    '& p': {
      margin: 0,
      color: '#4B5563',
      fontSize: '1.1rem',
      lineHeight: '1.5',
    },
    '@media (max-width: 768px)': {
      padding: '1rem',
      '& p': {
        fontSize: '1rem',
      }
    }
  },
  controlsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    '@media (max-width: 768px)': {
      flexDirection: 'column' as const,
    }
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    width: '100%',
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      flexDirection: 'column' as const,
    }
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    padding: '0 0.5rem',
  },
  messageTitle: {
    color: '#4B5563',
    fontSize: '1.1rem',
    fontWeight: '600',
  },
  languageToggle: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem',
    background: 'rgba(255, 255, 255, 0.8)',
    padding: '0.5rem',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(229, 231, 235, 0.5)',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
  },
  languageButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#6B7280',
    flex: '1',
    maxWidth: '160px',
    position: 'relative' as const,
    overflow: 'hidden',
    '&:hover': {
      color: '#4F46E5',
    },
    '&.active': {
      background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)',
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
    '@media (max-width: 768px)': {
      fontSize: '0.9rem',
      padding: '0.6rem 1rem',
    }
  }
};

const MessageBubble = styled.div<{ isUser: boolean }>`
  padding: 1.25rem 1.75rem;
  border-radius: 20px;
  max-width: 75%;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  background: ${props => props.isUser ? 
    'linear-gradient(135deg, #4F46E5, #7C3AED)' : 
    'linear-gradient(135deg, #f3f4f6, #e5e7eb)'};
  color: ${props => props.isUser ? '#ffffff' : '#1F2937'};
  box-shadow: ${props => props.isUser ?
    '0 4px 15px rgba(124, 58, 237, 0.1)' :
    '0 4px 15px rgba(0, 0, 0, 0.05)'};
  position: relative;
  transition: all 0.3s ease;
  animation: fadeIn 0.3s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 768px) {
    padding: 1rem 1.25rem;
    max-width: 85%;
    font-size: 0.95rem;
  }
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.isUser ?
      '0 6px 20px rgba(124, 58, 237, 0.15)' :
      '0 6px 20px rgba(0, 0, 0, 0.08)'};
  }
`;

const ActionButton = styled.button<{ variant: 'primary' | 'danger' | 'secondary' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 2.5rem;
  border-radius: 50px;
  border: none;
  background: ${props => {
    switch (props.variant) {
      case 'danger':
        return 'linear-gradient(135deg, #EF4444, #DC2626)';
      case 'secondary':
        return 'linear-gradient(135deg, #6B7280, #4B5563)';
      default:
        return 'linear-gradient(135deg, #4F46E5, #7C3AED)';
    }
  }};
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${props => {
    switch (props.variant) {
      case 'danger':
        return '0 4px 15px rgba(239, 68, 68, 0.2)';
      case 'secondary':
        return '0 4px 15px rgba(107, 114, 128, 0.2)';
      default:
        return '0 4px 15px rgba(124, 58, 237, 0.2)';
    }
  }};
  width: auto;
  min-width: 180px;

  @media (max-width: 768px) {
    width: 100%;
    padding: 1rem 2rem;
    font-size: 1rem;
    min-width: auto;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => {
      switch (props.variant) {
        case 'danger':
          return '0 8px 20px rgba(239, 68, 68, 0.25)';
        case 'secondary':
          return '0 8px 20px rgba(107, 114, 128, 0.25)';
        default:
          return '0 8px 20px rgba(124, 58, 237, 0.25)';
      }
    }};
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    margin-right: 10px;
    font-size: 1.2rem;
  }
`;

export default function EnglishConversation() {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isCancellable, setIsCancellable] = useState(false);
  const [isJapaneseMode, setIsJapaneseMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          setTranscript(transcript);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        setRecognition(recognition);
      } else {
        console.error('Speech recognition not supported in this browser');
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.start();
        setIsListening(true);
        setIsCancellable(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  }, [recognition]);

  const getSystemMessage = () => ({
    role: "system",
    content: isJapaneseMode 
      ? "あなたは英語学習を支援する日本人向けの英語教師です。ユーザーからの日本語での質問に対して、英語の意味や使い方を丁寧に説明してください。必要に応じて例文も提供してください。回答は日本語で行ってください。"
      : "You are a helpful English conversation partner. Respond naturally to the user's input and help them improve their English. Keep responses concise and conversational."
  } as ChatCompletionSystemMessageParam);

  useEffect(() => {
    if (recognition) {
      recognition.lang = isJapaneseMode ? 'ja-JP' : 'en-US';
    }
  }, [isJapaneseMode, recognition]);

  const stopListening = useCallback(async () => {
    if (recognition) {
      try {
        recognition.stop();
        setIsListening(false);
        setIsCancellable(false);

        if (transcript) {
          const newMessages = [...messages, { 
            role: 'user', 
            content: transcript,
            language: isJapaneseMode ? 'ja' : 'en'
          }];
          setMessages(newMessages as Message[]);

          try {
            const response = await openai.chat.completions.create({
              model: "gpt-4",
              messages: [
                getSystemMessage(),
                ...newMessages.map(msg => ({
                  role: msg.role,
                  content: msg.content
                } as ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam))
              ]
            });

            const assistantResponse = response.choices[0]?.message?.content;
            if (assistantResponse) {
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: assistantResponse,
                language: isJapaneseMode ? 'ja' : 'en'
              }]);
              
              if (!isJapaneseMode) {
                const utterance = new SpeechSynthesisUtterance(assistantResponse);
                utterance.lang = 'en-US';
                window.speechSynthesis.speak(utterance);
              }
            }
          } catch (error) {
            console.error('Error calling OpenAI:', error);
          }

          setTranscript('');
        }
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }, [recognition, transcript, messages, isJapaneseMode]);

  const cancelListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.stop();
        setIsListening(false);
        setIsCancellable(false);
        setTranscript('');
      } catch (error) {
        console.error('Error canceling recognition:', error);
      }
    }
  }, [recognition]);

  return (
    <div css={styles.container}>
      <div css={styles.header}>
        <h1>English Conversation Practice</h1>
        <p>Speak naturally with AI-powered English tutor</p>
      </div>

      <div css={styles.languageToggle}>
        <button
          css={[styles.languageButton, !isJapaneseMode && { '&.active': true }]}
          onClick={() => setIsJapaneseMode(false)}
          className={!isJapaneseMode ? 'active' : ''}
        >
          英語で会話
        </button>
        <button
          css={[styles.languageButton, isJapaneseMode && { '&.active': true }]}
          onClick={() => setIsJapaneseMode(true)}
          className={isJapaneseMode ? 'active' : ''}
        >
          日本語で会話
        </button>
      </div>

      <div>
        <div css={styles.messageHeader}>
          <span css={styles.messageTitle}></span>
          <ActionButton
            variant="secondary"
            onClick={() => {
              setMessages([]);
              setTranscript('');
              if (isListening) {
                cancelListening();
              }
            }}
            css={{
              minWidth: 'auto',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
            }}
          >
            <FaRedo /> Reset Chat
          </ActionButton>
        </div>
        <div css={styles.messageContainer}>
          {[...messages].reverse().map((message, index) => (
            <MessageBubble
              key={index}
              isUser={message.role === 'user'}
            >
              {message.content}
            </MessageBubble>
          ))}
        </div>
      </div>

      <div css={styles.transcriptBox}>
        <p>
          {transcript ? transcript : isJapaneseMode ? 
            '話し始めると、ここに文字が表示されます...' : 
            'Start speaking to see your words here...'}
        </p>
      </div>

      <div css={styles.controlsContainer}>
        <div css={styles.buttonGroup}>
          {!isListening ? (
            <ActionButton
              variant="primary"
              onClick={startListening}
            >
              <FaMicrophone /> {isJapaneseMode ? '話し始める' : 'Start Speaking'}
            </ActionButton>
          ) : (
            <>
              <ActionButton
                variant="danger"
                onClick={stopListening}
              >
                <FaStop /> {isJapaneseMode ? '停止して送信' : 'Stop & Send'}
              </ActionButton>
              {isCancellable && (
                <ActionButton
                  variant="secondary"
                  onClick={cancelListening}
                >
                  <FaTimes /> {isJapaneseMode ? 'キャンセル' : 'Cancel'}
                </ActionButton>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}