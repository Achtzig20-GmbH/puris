import React from 'react';
import { Typography, TypographyProps } from '@mui/material';

const H6: React.FC<TypographyProps> = ({ children, ...props }) => {
   return (
      <Typography variant="h6" {...props}>
         {children}
      </Typography>
   );
}

export default H6;