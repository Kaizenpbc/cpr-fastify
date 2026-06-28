import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Search...', value, onChange }) => (
  <TextField
    fullWidth
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon sx={{ color: (theme) => theme.palette.text.secondary }} />
        </InputAdornment>
      ),
    }}
    sx={{
      '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        '& fieldset': { borderColor: (theme) => theme.palette.divider },
        '&:hover fieldset': { borderColor: (theme) => theme.palette.text.secondary },
        '&.Mui-focused fieldset': {
          borderColor: '#CC1F1F',
          boxShadow: '0 0 0 3px rgba(204,31,31,.1)',
        },
      },
    }}
  />
);

export default SearchBar;
