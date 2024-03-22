/*
Copyright (c) 2022,2024 Volkswagen AG
Copyright (c) 2022,2024 Fraunhofer-Gesellschaft zur Foerderung der angewandten Forschung e.V. (represented by Fraunhofer ISST)
Copyright (c) 2022,2024 Contributors to the Eclipse Foundation

See the NOTICE file(s) distributed with this work for additional
information regarding copyright ownership.

This program and the accompanying materials are made available under the
terms of the Apache License, Version 2.0 which is available at
https://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations
under the License.

SPDX-License-Identifier: Apache-2.0
*/

import Card from '@mui/material/Card';

import { useTransfers } from '@hooks/edc/useTransfers';
import { Transfer } from '@models/types/edc/transfer';
import { Box, List, ListItem, Typography } from '@mui/material';

type TransferCardProps = {
    transfer: Transfer;
};

const TransferCard = ({ transfer }: TransferCardProps) => {
    return (
        <Card sx={{ padding: '1.25rem' }}>
            <Typography variant="h6" mb="0.5rem" fontWeight="600">Transfer</Typography>
            <Box sx={{
                display: 'flex',
                width: '100%',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    <Box display="flex" gap="1rem">
                        <Typography variant="body1" fontWeight="600" width="30ch"> Transfer Id: </Typography>
                        {transfer['@id']}
                    </Box>
                    <Box display="flex" gap="1rem">
                        <Typography variant="body1" fontWeight="600" width="30ch"> Correlation Id: </Typography>
                        {transfer['edc:correlationId']}
                    </Box>
                    <Box display="flex" gap="1rem">
                        <Typography variant="body1" fontWeight="600" width="30ch"> State: </Typography>
                        {transfer['edc:state']}
                    </Box>
                    <Box display="flex" gap="1rem">
                        <Typography variant="body1" fontWeight="600" width="30ch"> State Timestamp: </Typography>
                        {new Date(transfer['edc:stateTimestamp']).toLocaleString()}
                    </Box>
                    <Box display="flex" gap="1rem">
                        <Typography variant="body1" fontWeight="600" width="30ch"> Type: </Typography>
                        {transfer['edc:type']}
                    </Box>
                    <Box display="flex" gap="1rem">
                        <Typography variant="body1" fontWeight="600" width="30ch"> Asset Id: </Typography>
                        {transfer['edc:assetId']}
                    </Box>
                    <Box display="flex" gap="1rem">
                        <Typography variant="body1" fontWeight="600" width="30ch"> Contract Id: </Typography>
                        <Typography variant="body1" sx={{ wordBreak: 'break-all', width: '60ch' }}>{transfer['edc:contractId']}</Typography>
                    </Box>
                    <Box display="flex" gap="1rem">
                        <Typography variant="body1" fontWeight="600" width="30ch"> Connector Id: </Typography>
                        {transfer['edc:connectorId']}
                    </Box>
                </Box>
            </Box>
        </Card>
    );
};

export const TransferView = () => {
    const { transfers } = useTransfers();
    return (
        <Box sx={{
            display: 'flex',
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <Typography variant="subtitle1">Transfers</Typography>
            <List sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                width: '100ch'
            }}>
                {transfers && transfers.length > 0 ? (
                    transfers.map((transfer) => (
                        <ListItem>
                            <TransferCard transfer={transfer} />
                        </ListItem>
                    ))
                ) : (
                    <Typography variant="body1" align="center">No transfers found. This Page will be updated as soon as there are transfers.</Typography>
                )}
            </List>
        </Box>
    );
};
