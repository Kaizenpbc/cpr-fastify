import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { notificationService, Notification, SystemNotifications, NotificationFilters } from '../../services/notificationService';
import StatCard from '../gtacpr/StatCard';
import StatusChip from '../gtacpr/StatusChip';
import { PrimaryButton, GhostButton } from '../gtacpr/Buttons';

const getNotificationKind = (type: string) => {
  switch (type) {
    case 'timesheet_submitted':
    case 'profile_change_submitted':
    case 'payment_created':
      return 'warning' as const;
    case 'timesheet_approved':
    case 'payment_completed':
      return 'success' as const;
    case 'timesheet_rejected':
    case 'payment_rejected':
      return 'danger' as const;
    default:
      return 'neutral' as const;
  }
};

// Notification Item Component
const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}> = ({ notification, onMarkAsRead, onDelete }) => (
  <Box sx={{
    p: 2,
    borderBottom: '1px solid #F3F4F6',
    bgcolor: notification.isRead ? 'transparent' : '#F9FAFB',
    borderLeft: notification.isRead ? 'none' : '3px solid #CC1F1F',
  }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: notification.isRead ? 400 : 700, color: '#111827' }}>{notification.title}</Typography>
          <StatusChip kind={getNotificationKind(notification.type)} label={notification.type.replace(/_/g, ' ').toUpperCase()} />
        </Box>
        <Typography sx={{ fontSize: 13, color: '#4B5563', mb: 0.5 }}>{notification.message}</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(notification.createdAt).toLocaleString()}</Typography>
          {notification.senderName && <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>From: {notification.senderName}</Typography>}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
        {!notification.isRead && (
          <Box onClick={() => onMarkAsRead(notification.id)} sx={{ fontSize: 12, fontWeight: 600, color: '#16A34A', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>Read</Box>
        )}
        <Box onClick={() => onDelete(notification.id)} sx={{ fontSize: 12, fontWeight: 600, color: '#CC1F1F', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>Delete</Box>
      </Box>
    </Box>
  </Box>
);

// Send Notification Dialog
const SendNotificationDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSend: (recipientIds: number[], type: string, title: string, message: string) => void;
}> = ({ open, onClose, onSend }) => {
  const [recipientIds, setRecipientIds] = useState('');
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!recipientIds || !type || !title || !message) return;
    setLoading(true);
    try {
      const ids = recipientIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      await onSend(ids, type, title, message);
      onClose();
      setRecipientIds(''); setType(''); setTitle(''); setMessage('');
    } finally { setLoading(false); }
  };

  const handleClose = () => { onClose(); setRecipientIds(''); setType(''); setTitle(''); setMessage(''); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Send Notification</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}><TextField fullWidth label="Recipient IDs (comma-separated)" value={recipientIds} onChange={(e) => setRecipientIds(e.target.value)} placeholder="1, 2, 3" required /></Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={type} onChange={(e) => setType(e.target.value)} label="Type" required>
                <MenuItem value="timesheet_submitted">Timesheet Submitted</MenuItem>
                <MenuItem value="profile_change_submitted">Profile Change Submitted</MenuItem>
                <MenuItem value="payment_created">Payment Created</MenuItem>
                <MenuItem value="timesheet_approved">Timesheet Approved</MenuItem>
                <MenuItem value="timesheet_rejected">Timesheet Rejected</MenuItem>
                <MenuItem value="payment_completed">Payment Completed</MenuItem>
                <MenuItem value="payment_rejected">Payment Rejected</MenuItem>
                <MenuItem value="system">System Notification</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Message" value={message} onChange={(e) => setMessage(e.target.value)} required /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <GhostButton onClick={handleClose}>Cancel</GhostButton>
        <PrimaryButton onClick={handleSubmit} disabled={loading || !recipientIds || !type || !title || !message}>
          {loading ? 'Sending...' : 'Send'}
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
};

const NotificationsPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotifications | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [filters, setFilters] = useState<NotificationFilters>({ page: 1, limit: 20 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [unreadCount, setUnreadCount] = useState(0);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [notificationsData, systemData, statsData] = await Promise.all([
        notificationService.getNotifications(filters),
        notificationService.getSystemNotifications(),
        notificationService.getStats(),
      ]);
      setNotifications(notificationsData.notifications);
      setPagination(notificationsData.pagination);
      setUnreadCount(notificationsData.unreadCount);
      setSystemNotifications(systemData);
      setStats(statsData);
    } catch (err: any) {
      setError('Failed to load notification data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filters]);

  const handleMarkAsRead = async (id: number) => { await notificationService.markAsRead(id); await loadData(); };
  const handleDeleteNotification = async (id: number) => { await notificationService.deleteNotification(id); await loadData(); };
  const handleMarkAllAsRead = async () => { await notificationService.markAllAsRead(); await loadData(); };
  const handleSendNotification = async (recipientIds: number[], type: string, title: string, message: string) => {
    await notificationService.sendBulkNotifications({ recipient_ids: recipientIds, type, title, message });
    await loadData();
  };

  if (loading && notifications.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><CircularProgress size={48} /></Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      {stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <StatCard label="Total Notifications" value={stats.total} sub="All time" dotColor="#4B5563" />
          <StatCard label="Unread" value={stats.unread} sub="Need attention" dotColor="#CC1F1F" />
          <StatCard label="Pending Timesheets" value={systemNotifications?.pendingTimesheets || 0} sub="Awaiting review" dotColor="#ED6C02" />
          <StatCard label="Pending Payments" value={systemNotifications?.pendingPayments || 0} sub="Awaiting processing" dotColor="#16A34A" />
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <PrimaryButton onClick={() => setSendDialogOpen(true)}>Send Notification</PrimaryButton>
        <GhostButton onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>Mark All as Read</GhostButton>
        <GhostButton onClick={loadData} disabled={loading}>Refresh</GhostButton>
      </Box>

      {/* System Overview */}
      {systemNotifications && (
        <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', bgcolor: '#fff', p: 3 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 2 }}>System Overview</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 2 }}>
            {[
              ['Pending Timesheets', systemNotifications.pendingTimesheets],
              ['Pending Profile Changes', systemNotifications.pendingProfileChanges],
              ['Pending Payments', systemNotifications.pendingPayments],
            ].map(([label, value]) => (
              <Box key={String(label)}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>{label}</Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#ED6C02' }}>{value}</Typography>
              </Box>
            ))}
          </Box>
          {systemNotifications.recentActivities.length > 0 && (
            <>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', mb: 1 }}>Recent Activities</Typography>
              {systemNotifications.recentActivities.map((activity, index) => (
                <Box key={index} sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '6px', mb: 0.5 }}>
                  <Typography sx={{ fontSize: 13, color: '#111827' }}>{activity.message}</Typography>
                  <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(activity.timestamp).toLocaleString()}</Typography>
                </Box>
              ))}
            </>
          )}
        </Box>
      )}

      {/* Filter */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Show</InputLabel>
          <Select value={filters.unreadOnly ? 'true' : 'false'} onChange={(e) => setFilters(prev => ({ ...prev, unreadOnly: e.target.value === 'true', page: 1 }))} label="Show">
            <MenuItem value="false">All Notifications</MenuItem>
            <MenuItem value="true">Unread Only</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Notifications List */}
      <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', bgcolor: '#fff', overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#9CA3AF' }}>No notifications found</Typography>
            <Typography sx={{ fontSize: 13, color: '#9CA3AF', mt: 0.5 }}>You're all caught up!</Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
            />
          ))
        )}
      </Box>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Pagination count={pagination.pages} page={pagination.page} onChange={(_, p) => setFilters(prev => ({ ...prev, page: p }))} />
        </Box>
      )}

      <SendNotificationDialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} onSend={handleSendNotification} />
    </Box>
  );
};

export default NotificationsPanel;
