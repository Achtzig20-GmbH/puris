import React from 'react';
import { Typography, TypographyProps } from '@mui/material';

const Text: React.FC<TypographyProps> = ({ children, ...props }) => {
   return (
      <Typography variant="body1" {...props}>
         {children}
      </Typography>
   );
}

export default Text;