import { useAuth } from '@/features/auth/AuthContext';

/**
 * Hook für Shadow User Checks
 * @returns boolean - true wenn der aktuelle User ein Shadow User ist
 */
export function useShadowUserCheck(): boolean {
  const { user } = useAuth();
  return !!(user && (user as any).isShadowUser);
}

/**
 * Hook für Shadow User Checks mit Komponenten-Blockierung
 * @returns object mit isShadowUser boolean und BlockComponent React-Element
 */
export function useShadowUserBlock() {
  const isShadowUser = useShadowUserCheck();
  
  return {
    isShadowUser,
    shouldBlock: isShadowUser
  };
} 