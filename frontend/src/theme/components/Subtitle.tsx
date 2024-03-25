import React from 'react';
import { Typography, TypographyProps } from '@mui/material';

const Subtitle: React.FC<TypographyProps> = ({ children, ...props }) => {
   return (
      <Typography variant="subtitle1" {...props}>
         {children}
      </Typography>
   );
}

export default Subtitle;