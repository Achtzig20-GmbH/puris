import React from 'react';
import { Typography, TypographyProps } from '@mui/material';

const Logo: React.FC<TypographyProps> = ({ children, ...props }) => {
   return (
      <Typography
         variant="h2"
         color="primary"
         fontSize="2rem"
         fontWeight="600"
         mt="1rem"
         {...props}>
         {children}
      </Typography>
   );
}

export default Logo;