import React from 'react';
import { Box, Typography } from '@mui/material';

interface UserAvatarProps {
  initials: string;
  size?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ initials, size = 32 }) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: '#FFF0F0',
      color: '#CC1F1F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <Typography sx={{ fontSize: size * 0.4, fontWeight: 700, lineHeight: 1 }}>
      {initials}
    </Typography>
  </Box>
);

export default UserAvatar;
