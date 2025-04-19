import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

const PageHeader = ({ title, description, children, className }: PageHeaderProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("mb-6 space-y-4", className)}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {children && <div>{children}</div>}
      </div>
      <Separator />
    </motion.div>
  );
};

export default PageHeader;