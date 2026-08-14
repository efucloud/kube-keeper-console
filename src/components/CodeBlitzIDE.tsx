// src/components/CodeBlitzIDE.tsx
import React from 'react';
import { AppRenderer } from '@codeblitzjs/ide-core/bundle';
import '@codeblitzjs/ide-core/bundle/codeblitz.css';
import '@codeblitzjs/ide-core/languages';

interface CodeBlitzIDEProps {
  repoUrl: string; // e.g. https://github.com/opensumi/codeblitz
  accessToken?: string;
  branch?: string;
}

const CodeBlitzIDE: React.FC<CodeBlitzIDEProps> = ({
  repoUrl,
  accessToken,
  branch = 'main',
}) => {
  // 转换为 .git URL（AppRenderer 要求）
  const gitUrl = repoUrl.endsWith('.git') ? repoUrl : `${repoUrl}.git`;

  return (
    <div style={{ width: '100%', height: '80vh' }}>
      <AppRenderer
        appConfig={{
          workspaceDir: 'workspace', // 任意名称
          gitConfig: {
            remoteUrl: gitUrl,
            token: accessToken, // 私有仓库需要
            ref: branch,
          },
          // 可选：禁用终端、调试等
          disableTerminal: true,
          disableWelcome: true,
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default CodeBlitzIDE;