import zod from 'zod';
import * as authSchema from '../../src/schemas/auth.schema.js';
import * as quizSchema from '../../src/schemas/quiz.schema.js';
import * as userSchema from '../../src/schemas/user.schema.js';
import { de } from 'zod/locales';

describe('Schema Validation Unit Tests', () => {
    describe('Auth Schema', () => {
       describe('Signup Schema', () => {
            const baseValidData = {
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'password123',
                passwordConfirm: 'password123'
            };  
           it('should pass with valid data', () => {
               expect(() => authSchema.signupSchema.parse(baseValidData)).not.toThrow();
              });
              test.each([['invalid email', {...baseValidData, email: 'invalidemail'}],
                         ['short password', {...baseValidData, password: 'short', passwordConfirm: 'short'}],
                         ['mismatch password', {...baseValidData, passwordConfirm: 'different123'}],
                         ['empty username', {...baseValidData, username: ''}],
                         ['empty passwordConfirm', {...baseValidData, passwordConfirm: ''}],
                         ['empty password', {...baseValidData, password: ''}],
                         ['empty email', {...baseValidData, email: ''}]
                        ])('should fail with %s', (_, invalidData) => {
                  expect(() => authSchema.signupSchema.parse(invalidData)).toThrow();
              });
          });
         describe('Login Schema', () => {
                const baseValidData = {
                    email: 'testuser@example.com',
                    password: 'password123'
                };
                it('should pass with valid data', () => {
                    expect(() => authSchema.loginSchema.parse(baseValidData)).not.toThrow();
                });
                test.each([['invalid email', {...baseValidData, email: 'invalidemail'}],
                           ['empty email', {...baseValidData, email: ''}],
                           ['empty password', {...baseValidData, password: ''}]
                          ])('should fail with %s', (_, invalidData) => {
                    expect(() => authSchema.loginSchema.parse(invalidData)).toThrow();
                });
            });
            describe('Forgot Password Schema', () => {
                const baseValidData = {
                    email: 'testuser@example.com'
                };
                it('should pass with valid data', () => {
                    expect(() => authSchema.forgotPasswordSchema.parse(baseValidData)).not.toThrow();
                });
                test.each([['invalid email', {...baseValidData, email: 'invalidemail'}],
                           ['empty email', {...baseValidData, email: ''}]
                          ])('should fail with %s', (_, invalidData) => {
                    expect(() => authSchema.forgotPasswordSchema.parse(invalidData)).toThrow();
                });
            });
            describe('Reset Password Schema', () => {
                const baseValidData = {
                    password: 'newpassword123',
                    passwordConfirm: 'newpassword123'
                };
                it('should pass with valid data', () => {
                    expect(() => authSchema.resetPasswordSchema.parse(baseValidData)).not.toThrow();
                });
                test.each([['short password', {...baseValidData, password: 'short', passwordConfirm: 'short'}],
                           ['mismatch password', {...baseValidData, passwordConfirm: 'different123'}],
                           ['empty passwordConfirm', {...baseValidData, passwordConfirm: ''}],
                           ['empty password', {...baseValidData, password: ''}]
                          ])('should fail with %s', (_, invalidData) => {
                    expect(() => authSchema.resetPasswordSchema.parse(invalidData)).toThrow();
                });
            });
            describe('Update Password Schema', () => {
                const baseValidData = {
                    currentPassword: 'currentpassword123',
                    newPassword: 'newpassword123',
                    newPasswordConfirm: 'newpassword123'
                };
                it('should pass with valid data', () => {
                    expect(() => authSchema.updatePasswordSchema.parse(baseValidData)).not.toThrow();
                });
                test.each([['short new password', {...baseValidData, newPassword: 'short', newPasswordConfirm: 'short'}],
                           ['mismatch new password', {...baseValidData, newPasswordConfirm: 'different123'}],
                           ['empty current password', {...baseValidData, currentPassword: ''}],
                           ['empty new passwordConfirm', {...baseValidData, newPasswordConfirm: ''}],
                           ['empty new password', {...baseValidData, newPassword: ''}]
                          ])('should fail with %s', (_, invalidData) => {
                    expect(() => authSchema.updatePasswordSchema.parse(invalidData)).toThrow();
                });
            });
        });
        describe('Quiz Schema', () => {
            describe('Quiz Creation Schema', () => {
                const baseValidData = {
                    title: 'Sample Quiz',
                    quiz_description: 'A simple test quiz',
                    author_id: 1,
                    attempt_limit: 3,
                    time_limit: 30,
                    difficulty: 'easy'
                };
                it('should pass with valid data', () => {
                    expect(() => quizSchema.quizCreateSchema.parse(baseValidData)).not.toThrow();
                });
                test.each([['empty title', {...baseValidData, title: ''}],
                           ['negative attempt_limit', {...baseValidData, attempt_limit: -1}],
                           ['zero attempt_limit', {...baseValidData, attempt_limit: 0}],
                           ['negative time_limit', {...baseValidData, time_limit: -10}],
                           ['zero time_limit', {...baseValidData, time_limit: 0}],
                           ['invalid difficulty', {...baseValidData, difficulty: 'extreme'}]
                          ])('should fail with %s', (_, invalidData) => {
                    expect(() => quizSchema.quizCreateSchema.parse(invalidData)).toThrow();
                });
            });
            describe('Quiz Update Schema', () => {
                const baseValidData = {
                    title: 'Updated Quiz Title',
                    quiz_description: 'Updated description',
                    attempt_limit: 5,
                    time_limit: 45,
                    difficulty: 'medium'
                };
                it('should pass with valid data', () => {
                    expect(() => quizSchema.quizUpdateSchema.parse(baseValidData)).not.toThrow();
                });
                test.each([['empty title', {...baseValidData, title: ''}],
                           ['negative attempt_limit', {...baseValidData, attempt_limit: -2}],
                           ['zero attempt_limit', {...baseValidData, attempt_limit: 0}],
                           ['negative time_limit', {...baseValidData, time_limit: -15}],
                           ['zero time_limit', {...baseValidData, time_limit: 0}],
                           ['invalid difficulty', {...baseValidData, difficulty: 'extreme'}]
                          ])('should fail with %s', (_, invalidData) => {
                    expect(() => quizSchema.quizUpdateSchema.parse(invalidData)).toThrow();
                });
            });
            describe('Quiz Query Schema', () => {
                const baseValidData = {
                    limit: 10,
                    sort: 'desc',
                    page: 1,
                    rating: { gte: 0, lte: 5 }
                };
                it('should pass with valid data', () => {
                    expect(() => quizSchema.quizQuerySchema.parse(baseValidData)).not.toThrow();
                });
                test.each([['negative limit', {...baseValidData, limit: -5}],
                           ['zero limit', {...baseValidData, limit: 0}],
                           ['invalid sort', {...baseValidData, sort: 'ascending'}],
                           ['negative page', {...baseValidData, page: -1}],
                           ['zero page', {...baseValidData, page: 0}],
                           ['rating gte less than 0', {...baseValidData, rating: { gte: -1, lte: 5 }}],
                           ['rating lte greater than 5', {...baseValidData, rating: { gte: 0, lte: 6 }}]
                          ])('should fail with %s', (_, invalidData) => {
                    expect(() => quizSchema.quizQuerySchema.parse(invalidData)).toThrow();
                });
            });
            describe('Quiz Complex Schema', () => {
                const baseValidData = {
                    title: 'Complex Quiz',
                    quiz_description: 'A quiz with questions and options',
                    attempt_limit: 4,
                    time_limit: 60,
                    difficulty: 'hard',
                    questions: [
                        {
                            question_text: 'What is 2 + 2?',
                            question_type: 'single_choice',
                            points: 5,
                            options: [
                                { optionText: '3' },
                                { optionText: '4', isCorrect: true },
                                { optionText: '5' }
                            ]
                        }
                    ]
                };
                it('should pass with valid data', () => {
                    expect(() => quizSchema.quizComplexSchema.parse(baseValidData)).not.toThrow();
                });
                test.each([['empty title', {...baseValidData, title: ''}],
                           ['no questions', {...baseValidData, questions: []}],
                           ['question with empty text', {...baseValidData, questions: [{...baseValidData.questions[0], question_text: ''}]}],
                           ['question with invalid type', {...baseValidData, questions: [{...baseValidData.questions[0], question_type: 'boolean'}]}],
                           ['question with no options', {...baseValidData, questions: [{...baseValidData.questions[0], options: []}]}],
                           ['option with empty text', {...baseValidData, questions: [{...baseValidData.questions[0], options: [{ optionText: '' }]}]}]
                          ])('should fail with %s', (_, invalidData) => {
                    expect(() => quizSchema.quizComplexSchema.parse(invalidData)).toThrow();
                });
            });
            describe('Quiz ID Param Schema', () => {
                it('should pass with valid data', () => {
                    expect(() => quizSchema.quizIdParamSchema.parse({ quizId: 1 })).not.toThrow();
                });
                test.each([['non-integer quizId', { quizId: 'abc' }],
                           ['negative quizId', { quizId: -1 }],
                           ['zero quizId', { quizId: 0 }]
                          ])('should fail with %s', (_, invalidData) => {
                    expect(() => quizSchema.quizIdParamSchema.parse(invalidData)).toThrow();
                });
            });
            describe('Quiz Attempt ID Param Schema', () => {
                it('should pass with valid data', () => {
                    expect(() => quizSchema.quizAttemptIdParamSchema.parse({ attemptId: 1 })).not.toThrow();
                });
                test.each([['non-integer attemptId', { attemptId: 'abc' }],
                           ['negative attemptId', { attemptId: -1 }],
                           ['zero attemptId', { attemptId: 0 }]
                          ])('should fail with %s', (_, invalidData) => {
                    expect(() => quizSchema.quizAttemptIdParamSchema.parse(invalidData)).toThrow();
                });
            });
            describe('Quiz Name Param Schema', () => {
                it('should pass with valid data', () => {
                    expect(() => quizSchema.quizNameParamSchema.parse({ name: 'SampleQuiz' })).not.toThrow();
                });
                it('should fail with empty name', () => {
                    expect(() => quizSchema.quizNameParamSchema.parse({ name: '' })).toThrow();
                });
            });
            describe('Quiz Attempt Submission Schema', () => {
                const baseValidData = {
                    answers: [
                        {
                            question_id: 1,
                            selected_option_ids: [2],
                            free_text_answer: 'Sample answer'
                        }
                    ]
                };
                it('should pass with valid data', () => {
                    expect(() => quizSchema.quizAttemptSubmitSchema.parse(baseValidData)).not.toThrow();
                });
                test.each([['non-integer question_id', { answers: [{ question_id: 'abc', selected_option_ids: [2] }] }],
                           ['negative question_id', { answers: [{ question_id: -1, selected_option_ids: [2] }] }],
                           ['zero question_id', { answers: [{ question_id: 0, selected_option_ids: [2] }] }],
                           ['no question_id', { answers: [{ selected_option_ids: [2] }] }],
                           ['non-array selected_option_ids', { answers: [{ question_id: 1, selected_option_ids: 'notanarray' }] }],
                           ['non-integer selected_option_id', { answers: [{ question_id: 1, selected_option_ids: ['abc'] }] }],
                           ['negative selected_option_id', { answers: [{ question_id: 1, selected_option_ids: [-2] }] }],
                           ['zero selected_option_id', { answers: [{ question_id: 1, selected_option_ids: [0] }] }]
                          ])('should fail with %s', (_, invalidData) => {
                    expect(() => quizSchema.quizAttemptSubmitSchema.parse(invalidData)).toThrow();
                });
            });
        });
    describe('User Schema', () => {
        describe('Find User By Email Schema', () => {
            const baseValidData = {
                email: 'test@example.com'
            };
            it('should pass with valid data', () => {
                expect(() => userSchema.findUserByEmailSchema.parse(baseValidData)).not.toThrow();
            });
            test.each([['invalid email', {...baseValidData, email: 'invalidemail'}],
                       ['empty email', {...baseValidData, email: ''}]
                      ])('should fail with %s', (_, invalidData) => {
                expect(() => userSchema.findUserByEmailSchema.parse(invalidData)).toThrow();
            });
        });
        describe('Find Users By Name Schema', () => {
            const baseValidData = {
                name: 'John Doe'
            };
            it('should pass with valid data', () => {
                expect(() => userSchema.findUsersByNameSchema.parse(baseValidData)).not.toThrow();
            });
            it('should fail with empty name', () => {
                expect(() => userSchema.findUsersByNameSchema.parse({ name: '' })).toThrow();
            });
        });
        describe('Change Info Schema', () => {
            const baseValidData = {
                username: 'newusername',
                email: 'test@example.com'
            };
            it('should pass with valid data', () => {
                expect(() => userSchema.changeInfoSchema.parse(baseValidData)).not.toThrow();
            });
            it('should pass with partial data', () => {
                expect(() => userSchema.changeInfoSchema.parse({ username: 'partialusername' })).not.toThrow();
            });
            test.each([['invalid email', {...baseValidData, email: 'invalidemail'}],
                       ['short username', {...baseValidData, username: 'ab'}]
                      ])('should fail with %s', (_, invalidData) => {
                expect(() => userSchema.changeInfoSchema.parse(invalidData)).toThrow();
            });
        });
        describe('Query User Schema', () => {
            const baseValidData = {
                limit: 10,
                page: 1
            };
            it('should pass with valid data', () => {
                expect(() => userSchema.queryUserSchema.parse(baseValidData)).not.toThrow();
            });
            test.each([['negative limit', {...baseValidData, limit: -5}],
                       ['zero limit', {...baseValidData, limit: 0}],
                       ['negative page', {...baseValidData, page: -1}],
                       ['zero page', {...baseValidData, page: 0}]
                      ])('should fail with %s', (_, invalidData) => {
                expect(() => userSchema.queryUserSchema.parse(invalidData)).toThrow();
            });
        });
        describe('Find User By ID Schema', () => {
            it('should pass with valid data', () => {
                expect(() => userSchema.findUserByIdSchema.parse({ userId: 1 })).not.toThrow();
            });
            test.each([['non-integer userId', { userId: 'abc' }],
                       ['negative userId', { userId: -1 }],
                       ['zero userId', { userId: 0 }]
                      ])('should fail with %s', (_, invalidData) => {
                expect(() => userSchema.findUserByIdSchema.parse(invalidData)).toThrow();
            });
        });
    });
});
