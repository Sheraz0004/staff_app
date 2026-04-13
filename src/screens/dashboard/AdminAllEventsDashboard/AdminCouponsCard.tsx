import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import SvgIcons from '../../../components/SvgIcons';
import { color } from '../../../color/color';
import Typography from '../../../components/Typography';
import { TicketStatBox, MiniStatCard } from '../../../constants/ticketStatBox';
import { selectDashboardData } from '../../../redux/reducers/dashboardReducer';
import { styles } from './AdminCouponsCard.styles';

const safeFormatAmount = (currency: any, value: any): string => {
  const num = typeof value === 'number' && isFinite(value) ? value : 0;
  const formatted = num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${currency ?? 'GHS'} ${formatted}`;
};

const AdminCouponsCard: React.FC = () => {
  const dashboardData = useSelector(selectDashboardData);

  const currency = dashboardData?.currency ?? 'GHS';
  const sold = dashboardData?.coupons?.sold ?? { count: 0, value: 0 };
  const refunded = dashboardData?.coupons?.refunded ?? { count: 0, value: 0 };
  const cancelled = dashboardData?.coupons?.cancelled ?? { count: 0, value: 0 };

  return (
    <View style={styles.card}>
      <Typography
        style={styles.cardTitle}
        weight="700"
        size={13}
        color={color.placeholderTxt_24282C}
      >
        Coupons
      </Typography>

      <TicketStatBox
        icon={<SvgIcons.couponIcon width={32} height={32} />}
        label="Coupons Sold"
        count={String(sold?.count ?? 0)}
        grossAmount={safeFormatAmount(currency, sold?.value)}
        netAmount="—"
      />

      <View style={styles.statRow}>
        <MiniStatCard
          icon={<SvgIcons.totalActiveCoupon width={32} height={32} />}
          label="Coupons Refunded"
          count={String(refunded?.count ?? 0)}
          amount={safeFormatAmount(currency, refunded?.value)}
        />
        <MiniStatCard
          icon={<SvgIcons.ticketCanceled width={32} height={32} />}
          label="Coupons Canceled"
          count={String(cancelled?.count ?? 0)}
          amount={safeFormatAmount(currency, cancelled?.value)}
        />
      </View>
    </View>
  );
};

export default AdminCouponsCard;
