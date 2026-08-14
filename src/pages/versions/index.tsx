import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { type FC } from 'react';
import { Card, Tag } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { getColorPrimary } from '@/utils/global';

const VersionIndex: FC = () => {
  const intl = useIntl();
  const colorPrimary = getColorPrimary();
  const versions = [
    {
      titleKey: 'pages.versions.card.community.title',
      key: 'community',
      featureKeys: [
        'pages.versions.card.community.feature.1',
        'pages.versions.card.saas.feature.3',
        'pages.versions.card.saas.feature.4',
        'pages.versions.card.community.feature.5',
        'pages.versions.card.community.feature.6',
      ],
      tag: null,
    },

    {
      titleKey: 'pages.versions.card.enterprise.title',
      key: 'enterprise',
      featureKeys: [
        'pages.versions.card.enterprise.feature.1',
        'pages.versions.card.saas.feature.3',
        'pages.versions.card.saas.feature.4',
        'pages.versions.card.enterprise.feature.4',
        'pages.versions.card.enterprise.feature.5',
        'pages.versions.card.enterprise.feature.6',
      ],
      tag: null,
    },
    {
      titleKey: 'pages.versions.card.saas.title',
      key: 'saas',
      featureKeys: [
        'pages.versions.card.saas.feature.1',
        'pages.versions.card.saas.feature.2',
        'pages.versions.card.saas.feature.3',
        'pages.versions.card.saas.feature.4',
        'pages.versions.card.saas.feature.5',
        'pages.versions.card.saas.feature.6',
        'pages.versions.card.saas.feature.7',
        'pages.versions.card.saas.feature.8',
        'pages.versions.card.saas.feature.9',
        'pages.versions.card.saas.feature.10',
      ],
      tag: intl.formatMessage({ id: 'pages.versions.badge.hot' }),
    },
  ];

  // 统一卡片尺寸
  const cardWidth = 280;
  const cardHeight = 480; // 可根据内容调整

  return (
    <PageContainer title={false}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: 'rgba(0, 0, 0, 0.85)' }}>
              {intl.formatMessage({ id: 'pages.versions.title' })}
            </h2>
            <a
              href="https://efucloud.com"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              {intl.formatMessage({ id: 'pages.versions.product.link' })}
            </a>
          </div>
          <p style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: 14, marginTop: 8 }}>
            {intl.formatMessage({ id: 'pages.versions.description' })}
          </p>
        </div>

        {/* 使用 flex 容器确保对齐 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          {versions.map((version) => (
            <Card
              key={version.key}
              style={{
                width: cardWidth,
                height: cardHeight,
                borderRadius: 12,
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
                border: '1px solid #f0f0f0',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
              bodyStyle={{
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              {/* 热门标签 */}
              {version.tag && (
                <Tag
                  color={colorPrimary}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '4px 8px',
                    borderRadius: 4,
                  }}
                >
                  {version.tag}
                </Tag>
              )}

              {/* 标题 */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>
                  {intl.formatMessage({ id: version.titleKey })}
                </h3>
              </div>

              {/* 功能列表 - 自动撑满中间区域 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                {version.featureKeys.map((featureKey, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: 12,
                    }}
                  >
                    <CheckCircleOutlined
                      style={{
                        color: colorPrimary,
                        marginRight: 8,
                        marginTop: 4,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.85)' }}>
                      {intl.formatMessage({ id: featureKey })}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default VersionIndex;
