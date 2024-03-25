import React from 'react';
import { Button, ButtonProps } from '@mui/material';

const CustomButton: React.FC<ButtonProps> = ({ children, ...props }) => {
   return (
      <Button
         variant="contained"
         color="primary"
         {...props}>
            {children}
      </Button>
   );
}

export default CustomButton;