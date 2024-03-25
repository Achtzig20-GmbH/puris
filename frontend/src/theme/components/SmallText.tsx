import React from 'react';
import { Typography, TypographyProps } from '@mui/material';

const SmallText: React.FC<TypographyProps> = ({ children, ...props }) => {
   return (
      <Typography variant="body2" {...props}>
         {children}
      </Typography>
   );
}

export default SmallText;