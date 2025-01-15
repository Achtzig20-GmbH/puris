import { InfoOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

type InfoButtonProps = {
    text: string;
};

export function InfoButton({ text }: InfoButtonProps) {
    return (
        <Tooltip title={text}>
            <IconButton sx={{ padding: 0, fontSize: '1rem', color: '#999' }}>
                <InfoOutlined />
            </IconButton>
        </Tooltip>
    );
}
