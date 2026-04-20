import { StyleSheet } from 'react-native';
import { color } from '../../color/color';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.grey_F5F5F5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },

  // ─── Buyer Card ─────────────────────────────────────────────────────────────
  buyerCard: {
    backgroundColor: color.white_FFFFFF,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  buyerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '600',
    color: color.placeholderTxt_24282C,
    marginBottom: 4,
  },
  buyerSub: {
    fontSize: 13,
    color: color.brown_766F6A,
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusPaid: {
    backgroundColor: '#E6F4EA',
  },
  statusUnpaid: {
    backgroundColor: '#FFF3E0',
  },
  statusCanceled: {
    backgroundColor: '#FDECEA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPaid: {
    color: '#2E7D32',
  },
  statusTextUnpaid: {
    color: '#E65100',
  },
  statusTextCanceled: {
    color: '#C62828',
  },
  divider: {
    height: 1,
    backgroundColor: color.grey_E4E4E4,
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: color.brown_766F6A,
    fontWeight: '400',
  },
  metaValue: {
    fontSize: 13,
    color: color.placeholderTxt_24282C,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 8,
  },

  // ─── Section Header ──────────────────────────────────────────────────────────
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: color.black_2F251D,
    marginBottom: 10,
    marginTop: 4,
  },

  // ─── Ticket Card ─────────────────────────────────────────────────────────────
  ticketCard: {
    backgroundColor: color.white_FFFFFF,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: color.placeholderTxt_24282C,
  },
  scanBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  scanBadgeScanned: {
    backgroundColor: '#E6F4EA',
  },
  scanBadgeUnscanned: {
    backgroundColor: color.grey_E4E4E4,
  },
  scanBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scanBadgeTextScanned: {
    color: '#2E7D32',
  },
  scanBadgeTextUnscanned: {
    color: color.brown_766F6A,
  },
  ticketMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketMetaLeft: {
    flex: 1,
  },
  ticketMetaRight: {
    alignItems: 'flex-end',
  },
  ticketLabel: {
    fontSize: 12,
    color: color.brown_766F6A,
    marginBottom: 2,
  },
  ticketValue: {
    fontSize: 13,
    color: color.black_544B45,
    fontWeight: '500',
    marginBottom: 6,
  },

  // ─── Loading / Empty ─────────────────────────────────────────────────────────
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 14,
    color: color.brown_766F6A,
    textAlign: 'center',
  },
});
