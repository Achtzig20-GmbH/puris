import React from 'react';
import { Typography, TypographyProps } from '@mui/material';

const Subtitle2: React.FC<TypographyProps> = ({ children, ...props }) => {
   return (
      <Typography
         variant="h6"
         {...props}>
         {children}
      </Typography>
   );
}

export default Subtitle2;