import { Avatar, theme } from 'antd';
import React from 'react';
import { FaRegUser } from 'react-icons/fa';
import type { CopilotStyleMap } from '@/pages/kubernetes/components/ai_content_stream';

export const AiContentQuestion: React.FC<{
  question: string;
  fallbackText: string;
  styles: CopilotStyleMap;
  markdownRenderer: (
    content: string,
    options?: { streaming?: boolean },
  ) => React.ReactNode;
}> = ({ question, fallbackText, styles }) => {
  const { token } = theme.useToken();
  return (
    <div className={styles.questionRow}>
      <Avatar
        size={28}
        className={styles.questionAvatar}
        icon={<FaRegUser size={12} color={token.colorPrimary} />}
      />
      <div className={styles.questionBubble}>
        <div className={styles.questionText}>{question || fallbackText}</div>
      </div>
    </div>
  );
};
