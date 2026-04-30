import Card from '@components/ui/Card';
import {type ReactNode} from 'react';

interface InfoCardProps {
  title: string;
  children: ReactNode;
}

export default function InfoCard({title, children}: InfoCardProps) {
  return (
    <Card hover={false}>
      <div className="p-7">
        <h2 className="text-lg font-semibold text-text border-b border-border pb-3 mb-5">{title}</h2>
        {children}
      </div>
    </Card>
  );
}

