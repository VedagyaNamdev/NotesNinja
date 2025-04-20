"use client";

// This file provides backward compatibility with code that imports from use-auth.tsx
// It re-exports the hook from the canonical path (useAuth.ts)

import { useAuth } from './useAuth';
import type { UserRole } from './useAuth';

export { useAuth };
export type { UserRole }; 