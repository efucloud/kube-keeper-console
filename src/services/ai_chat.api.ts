export interface AiChatWebSocketParams {
  cluster: string;
  namespace?: string;
  accessToken: string;
  locale: string;
}

export const buildAiChatWebSocketUrl = ({
  cluster,
  namespace,
  accessToken,
  locale,
}: AiChatWebSocketParams) => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const namespacePath = namespace
    ? `/namespace/${encodeURIComponent(namespace)}`
    : '';
  const query = new URLSearchParams({
    access_token: accessToken,
    lang: locale,
  });

  return `${protocol}://${window.location.host}/api/ws/cluster/${encodeURIComponent(
    cluster,
  )}${namespacePath}/chat?${query.toString()}`;
};
