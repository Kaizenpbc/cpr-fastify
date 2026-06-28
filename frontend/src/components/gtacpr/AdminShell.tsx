import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Typography, Drawer } from '@mui/material';
import ThemeToggle from '../common/ThemeToggle';

const SIDEBAR_WIDTH = 248;

export interface ShellNavItem {
  label: string;
  path: string;
}

export interface AdminShellProps {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  portalName?: string;
  navItems: ShellNavItem[];
  basePath: string;
  subtitle?: string;
  onNavigate?: (path: string) => void;
  activePath?: string;
}

const AdminShell: React.FC<AdminShellProps> = ({
  eyebrow,
  title,
  actions,
  children,
  portalName = 'Admin Console',
  navItems,
  basePath,
  subtitle,
  onNavigate,
  activePath,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (activePath) return path === activePath;
    // Check if the current pathname ends with this path segment
    const segments = location.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (path === basePath) {
      return lastSegment === basePath || location.pathname.endsWith('/' + basePath);
    }
    return lastSegment === path || location.pathname.endsWith('/' + path);
  };

  const handleNavClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      // Navigate relative to the portal base (go up one segment, then to the new path)
      navigate('../' + path, { relative: 'path' });
    }
  };

  const userInitial = (user?.firstName?.[0] || user?.username?.[0] || 'A').toUpperCase();
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.username || 'User';
  const userEmail = user?.email || '';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Dark Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: '#111827',
            borderRight: 'none',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Brand block */}
          <Box
            sx={{
              padding: '20px 22px',
              borderBottom: '1px solid rgba(255,255,255,.07)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                backgroundColor: '#CC1F1F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Typography sx={{ color: '#fff', fontSize: '16px', fontWeight: 800 }}>G</Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                GTACPR
              </Typography>
              <Typography
                sx={{
                  fontSize: '9.5px',
                  fontWeight: 600,
                  color: '#9CA3AF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  lineHeight: 1.2,
                }}
              >
                {portalName}
              </Typography>
            </Box>
          </Box>

          {/* Subtitle (e.g. org name) */}
          {subtitle && (
            <Box sx={{ padding: '10px 22px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              <Typography
                sx={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#9CA3AF',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {subtitle}
              </Typography>
            </Box>
          )}

          {/* Nav list */}
          <Box sx={{ padding: '14px 12px', flex: 1, overflowY: 'auto' }}>
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Box
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '11px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    mb: '2px',
                    backgroundColor: active ? '#CC1F1F' : 'transparent',
                    '&:hover': {
                      backgroundColor: active ? '#9B1515' : 'rgba(255,255,255,.06)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      backgroundColor: active ? '#fff' : 'rgba(255,255,255,.25)',
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: '13.5px',
                      fontWeight: active ? 700 : 500,
                      color: active ? '#fff' : '#9CA3AF',
                      lineHeight: 1.3,
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Logout */}
          <Box sx={{ padding: '0 12px 8px' }}>
            <Box
              onClick={handleLogout}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                padding: '9px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'rgba(255,255,255,.06)' },
              }}
            >
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,.25)',
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ fontSize: '13.5px', fontWeight: 500, color: '#9CA3AF' }}>
                Logout
              </Typography>
            </Box>
          </Box>

          {/* User block */}
          <Box
            sx={{
              padding: '16px 18px',
              borderTop: '1px solid rgba(255,255,255,.07)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: '#CC1F1F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Typography sx={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                {userInitial}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#fff',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {userName}
              </Typography>
              {userEmail && (
                <Typography
                  sx={{
                    fontSize: '11px',
                    color: '#9CA3AF',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {userEmail}
                </Typography>
              )}
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <ThemeToggle size="small" />
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top header */}
        <Box
          sx={{
            backgroundColor: '#fff',
            borderBottom: '1px solid #E5E7EB',
            padding: '18px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                lineHeight: 1,
                mb: 0.5,
              }}
            >
              {eyebrow}
            </Typography>
            <Typography
              sx={{
                fontSize: '21px',
                fontWeight: 800,
                color: '#111827',
                letterSpacing: '-0.015em',
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
          </Box>
          {actions && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              {actions}
            </Box>
          )}
        </Box>

        {/* Content area */}
        <Box
          sx={{
            backgroundColor: '#F9FAFB',
            padding: '28px 32px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            overflowY: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminShell;
