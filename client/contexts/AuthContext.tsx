import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  sendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<{ success: boolean; error?: string }>;
  updateUserEmail: (newEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  reauthenticate: (password: string) => Promise<boolean>;
  deleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const AUTH_STORAGE_KEY = '@agrisense_auth_state';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Initialize auth and load saved state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔧 Initializing AuthContext...');
        
        // Wait for Firebase auth to be ready
        const checkAuthReady = () => {
          return new Promise<void>((resolve) => {
            if (auth) {
              console.log('✅ Firebase Auth instance found');
              resolve();
            } else {
              console.log('⏳ Waiting for Firebase Auth...');
              setTimeout(() => checkAuthReady().then(resolve), 100);
            }
          });
        };

        await checkAuthReady();
        console.log('✅ Firebase Auth is ready');

        // Load saved auth state from AsyncStorage
        try {
          const savedAuthState = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
          if (savedAuthState) {
            const parsedState = JSON.parse(savedAuthState);
            if (parsedState.user && parsedState.timestamp) {
              const oneHourAgo = Date.now() - (60 * 60 * 1000);
              if (parsedState.timestamp > oneHourAgo) {
                const minimalUser = {
                  uid: parsedState.user.uid,
                  email: parsedState.user.email,
                  emailVerified: parsedState.user.emailVerified || false,
                  displayName: parsedState.user.displayName || null,
                  photoURL: parsedState.user.photoURL || null,
                  phoneNumber: parsedState.user.phoneNumber || null,
                  metadata: parsedState.user.metadata || { creationTime: '', lastSignInTime: '' },
                  providerData: [],
                  refreshToken: '',
                  tenantId: null,
                  delete: async () => {},
                  getIdToken: async () => '',
                  getIdTokenResult: async () => ({ token: '', expirationTime: '', issuedAtTime: '', authTime: '', signInProvider: null, signInSecondFactor: null, claims: {} }),
                  reload: async () => {},
                  toJSON: () => ({}),
                  isAnonymous: false,
                  providerId: 'firebase',
                } as User;
                
                setUser(minimalUser);
                console.log('✅ Loaded user from storage');
              }
            }
          }
        } catch (storageError) {
          console.error('❌ Failed to load auth state from storage:', storageError);
        }

        setAuthReady(true);
        setInitialized(true);
        console.log('✅ AuthContext initialized successfully');
      } catch (error) {
        console.error('❌ AuthContext initialization error:', error);
        setInitialized(true);
        setAuthReady(true);
      }
    };

    initializeAuth();
  }, []);

  // Listen to auth state changes once initialized
  useEffect(() => {
    if (!initialized || !authReady) return;

    console.log('👂 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      
      if (firebaseUser) {
        try {
          await firebaseUser.reload();
          const refreshedUser = auth.currentUser;
          console.log('✅ User refreshed:', refreshedUser?.email);
          setUser(refreshedUser);
          
          if (refreshedUser) {
            const userData = {
              uid: refreshedUser.uid,
              email: refreshedUser.email,
              displayName: refreshedUser.displayName,
              photoURL: refreshedUser.photoURL,
              emailVerified: refreshedUser.emailVerified,
              phoneNumber: refreshedUser.phoneNumber,
              metadata: refreshedUser.metadata
            };
            
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
              user: userData,
              timestamp: Date.now(),
            }));
            console.log('💾 User data saved to storage');
          }
        } catch (error) {
          console.error('❌ Error refreshing user:', error);
          setUser(firebaseUser);
        }
      } else {
        console.log('👋 User logged out, clearing storage');
        setUser(null);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      
      setLoading(false);
    }, (error) => {
      console.error('❌ Auth state change error:', error);
      setLoading(false);
    });

    return () => {
      console.log('🧹 Cleaning up auth listener');
      unsubscribe();
    };
  }, [initialized, authReady]);

  // Function to manually refresh user data
  const refreshUserData = async () => {
    if (user) {
      try {
        await user.reload();
        const refreshedUser = auth.currentUser;
        setUser(refreshedUser);
        console.log('✅ User data refreshed manually');
      } catch (error) {
        console.error('❌ Failed to refresh user data:', error);
      }
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'Authentication service not ready' };
    }

    try {
      setLoading(true);
      console.log('🔐 Attempting login for:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      await userCredential.user.reload();
      console.log('✅ Login successful');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || 'Login failed.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'Authentication service not ready' };
    }

    try {
      setLoading(true);
      console.log('📝 Attempting signup for:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      await sendEmailVerification(userCredential.user);
      console.log('✅ Signup successful');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      
      let errorMessage = 'Signup failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Use at least 6 characters.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || 'Signup failed.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    if (!auth) {
      throw new Error('Authentication service not ready');
    }

    try {
      setLoading(true);
      console.log('🚪 Attempting to sign out...');
      
      await signOut(auth);
      console.log('✅ Firebase sign out successful');
      
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      console.log('✅ AsyncStorage cleared');
      
      setUser(null);
      console.log('✅ User state set to null');
      
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      
      let errorMessage = 'Logout failed. Please try again.';
      
      switch (error.code) {
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || 'Logout failed.';
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'Authentication service not ready' };
    }

    try {
      console.log('🔄 Sending password reset to:', email);
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      
      let errorMessage = 'Failed to send reset email.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || 'Failed to send reset email.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const sendVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      if (auth.currentUser.emailVerified) {
        return { success: false, error: 'Email is already verified' };
      }

      console.log('📧 Sending verification email');
      await sendEmailVerification(auth.currentUser);
      console.log('✅ Verification email sent');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Send verification email error:', error);
      
      let errorMessage = 'Failed to send verification email.';
      
      switch (error.code) {
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || 'Failed to send verification email.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      console.log('🔄 Updating user profile');
      await updateProfile(auth.currentUser, data);
      
      const updatedUser = { ...auth.currentUser };
      if (data.displayName !== undefined) {
        Object.assign(updatedUser, { displayName: data.displayName });
      }
      if (data.photoURL !== undefined) {
        Object.assign(updatedUser, { photoURL: data.photoURL });
      }
      
      setUser(updatedUser as User);

      try {
        const userData = {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: data.displayName || auth.currentUser.displayName,
          photoURL: data.photoURL || auth.currentUser.photoURL,
          emailVerified: auth.currentUser.emailVerified,
          phoneNumber: auth.currentUser.phoneNumber,
          metadata: auth.currentUser.metadata
        };
        
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          user: userData,
          timestamp: Date.now(),
        }));
        console.log('💾 Profile update saved to storage');
      } catch (storageError) {
        console.error('❌ Failed to update auth state:', storageError);
      }
      
      console.log('✅ Profile updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Update profile error:', error);
      
      let errorMessage = 'Failed to update profile.';
      
      switch (error.code) {
        case 'auth/requires-recent-login':
          errorMessage = 'Please re-authenticate to update your profile.';
          break;
        default:
          errorMessage = error.message || 'Failed to update profile.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const updateUserEmail = async (newEmail: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      console.log('🔄 Updating user email');
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);

      await updateEmail(currentUser, newEmail);
      await sendEmailVerification(currentUser);
      
      setUser({ ...currentUser } as User);
      console.log('✅ Email updated successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Update email error:', error);
      
      let errorMessage = 'Failed to update email.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already in use.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Please re-login to update your email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        default:
          errorMessage = error.message || 'Failed to update email.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      console.log('🔄 Changing password');
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      await updatePassword(user, newPassword);
      console.log('✅ Password changed successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Change password error:', error);
      
      let errorMessage = 'Failed to change password.';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect.';
          break;
        case 'auth/weak-password':
          errorMessage = 'New password is too weak. Use at least 6 characters.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Please log in again to change your password.';
          break;
        default:
          errorMessage = error.message || 'Failed to change password.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const reauthenticate = async (password: string): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user || !user.email) return false;

    try {
      console.log('🔐 Re-authenticating user');
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      console.log('✅ Re-authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Re-authentication error:', error);
      return false;
    }
  };

  const deleteAccount = async (password: string): Promise<{ success: boolean; error?: string }> => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      console.log('🗑️ Deleting account');
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      await user.delete();
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      console.log('✅ Account deleted successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Delete account error:', error);
      
      let errorMessage = 'Failed to delete account.';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Please re-login to delete your account.';
          break;
        default:
          errorMessage = error.message || 'Failed to delete account.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    initialized,
    login,
    signup,
    logout,
    resetPassword,
    sendVerificationEmail,
    updateUserProfile,
    updateUserEmail,
    changePassword,
    reauthenticate,
    deleteAccount,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}