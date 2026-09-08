import {
  CheckCircleFilled,
  ExportOutlined,
  GithubOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Card, Tag, Typography, theme } from 'antd';
import type { FC, ReactNode } from 'react';
import styles from './index.less';

type Plan = {
  key: string;
  titleKey: string;
  descriptionKey: string;
  badgeKey: string;
  icon: ReactNode;
  featureKeys: string[];
  actionKey: string;
  actionIcon: ReactNode;
  actionUrl: string;
  featured?: boolean;
};

const plans: Plan[] = [
  {
    key: 'open-source',
    titleKey: 'pages.versions.card.opensource.title',
    descriptionKey: 'pages.versions.card.opensource.description',
    badgeKey: 'pages.versions.card.opensource.badge',
    icon: <GithubOutlined />,
    featureKeys: [
      'pages.versions.card.opensource.feature.1',
      'pages.versions.card.opensource.feature.2',
      'pages.versions.card.opensource.feature.3',
      'pages.versions.card.opensource.feature.4',
      'pages.versions.card.opensource.feature.5',
      'pages.versions.card.opensource.feature.6',
      'pages.versions.card.opensource.feature.7',
    ],
    actionKey: 'pages.versions.card.opensource.action',
    actionIcon: <GithubOutlined />,
    actionUrl: 'https://github.com/efucloud/kube-keeper',
  },
  {
    key: 'saas',
    titleKey: 'pages.versions.card.saas.title',
    descriptionKey: 'pages.versions.card.saas.description',
    badgeKey: 'pages.versions.card.saas.badge',
    icon: <SafetyCertificateOutlined />,
    featureKeys: [
      'pages.versions.card.saas.feature.1',
      'pages.versions.card.saas.feature.2',
      'pages.versions.card.saas.feature.3',
      'pages.versions.card.saas.feature.4',
      'pages.versions.card.saas.feature.5',
      'pages.versions.card.saas.feature.6',
      'pages.versions.card.saas.feature.7',
      'pages.versions.card.saas.feature.8',
    ],
    actionKey: 'pages.versions.card.saas.action',
    actionIcon: <ExportOutlined />,
    actionUrl: 'https://efucloud.com',
    featured: true,
  },
];

const VersionIndex: FC = () => {
  const intl = useIntl();
  const { token } = theme.useToken();

  return (
    <PageContainer title={false} className={styles.page}>
      <section className={styles.hero}>
        <Typography.Title level={1} className={styles.title}>
          {intl.formatMessage({ id: 'pages.versions.title' })}
        </Typography.Title>
        <Typography.Paragraph type="secondary" className={styles.description}>
          {intl.formatMessage({ id: 'pages.versions.description' })}
        </Typography.Paragraph>
      </section>

      <div className={styles.grid}>
        {plans.map((plan) => (
          <Card
            key={plan.key}
            className={`${styles.card} ${plan.featured ? styles.featured : ''}`}
            style={
              plan.featured
                ? {
                    borderColor: token.colorPrimaryBorder,
                    background: `linear-gradient(180deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 42%)`,
                  }
                : undefined
            }
          >
            <div className={styles.cardHeader}>
              <div
                className={styles.planIcon}
                style={{
                  background: plan.featured
                    ? token.colorPrimaryBg
                    : token.colorFillSecondary,
                  color: plan.featured
                    ? token.colorPrimary
                    : token.colorTextSecondary,
                }}
              >
                {plan.icon}
              </div>
              <Tag
                bordered={false}
                color={plan.featured ? 'blue' : 'default'}
                className={styles.planBadge}
              >
                {intl.formatMessage({ id: plan.badgeKey })}
              </Tag>
            </div>

            <Typography.Title level={2} className={styles.planTitle}>
              {intl.formatMessage({ id: plan.titleKey })}
            </Typography.Title>
            <Typography.Paragraph
              type="secondary"
              className={styles.planDescription}
            >
              {intl.formatMessage({ id: plan.descriptionKey })}
            </Typography.Paragraph>

            <ul className={styles.features}>
              {plan.featureKeys.map((featureKey) => (
                <li key={featureKey}>
                  <CheckCircleFilled
                    className={styles.featureIcon}
                    style={{ color: token.colorSuccess }}
                  />
                  <span>{intl.formatMessage({ id: featureKey })}</span>
                </li>
              ))}
            </ul>

            <Button
              block
              size="large"
              type={plan.featured ? 'primary' : 'default'}
              icon={plan.actionIcon}
              href={plan.actionUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.action}
            >
              {intl.formatMessage({ id: plan.actionKey })}
            </Button>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};

export default VersionIndex;
