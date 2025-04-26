import { toast as sonnerToast } from 'sonner';

// Custom toast with dark description text
export function toast(message: string, options?: any) {
  return sonnerToast(message, {
    ...options,
    // Apply inline styles to ensure description is visible
    style: { 
      '--description-color': 'black',
      '--description-font-weight': '600',
      ...options?.style 
    },
    // Add custom class for styling via CSS
    className: `toast-with-visible-description ${options?.className || ''}`,
  });
}

// Re-export other toast methods
export const success = (message: string, options?: any) => 
  toast.success(message, {
    ...options,
    style: { 
      '--description-color': 'black',
      '--description-font-weight': '600',
      ...options?.style 
    },
  });

export const error = (message: string, options?: any) => 
  toast.error(message, {
    ...options,
    style: { 
      '--description-color': 'black',
      '--description-font-weight': '600',
      ...options?.style 
    },
  });

export const warning = (message: string, options?: any) => 
  toast.warning(message, {
    ...options,
    style: { 
      '--description-color': 'black',
      '--description-font-weight': '600',
      ...options?.style 
    },
  });

// Allow direct usage of the original toast too
export { sonnerToast }; 