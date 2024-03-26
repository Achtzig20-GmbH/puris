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

import { useNegotiations } from '@hooks/edc/useNegotiations';
import { Negotiation } from '@models/types/edc/negotiation';
import { Box, List, ListItem } from '@mui/material';
import Text from '../theme/components/Text';
import Subtitle from '../theme/components/Subtitle';
import Subtitle2 from '../theme/components/Subtitle2';

type NegotiationCardProps = {
    negotiation: Negotiation;
};

const NegotiationCard = ({negotiation }: NegotiationCardProps) => {
    return (
        <Card sx={{ padding: '1.25rem' }}>
            <Subtitle2 mb="0.5rem" fontWeight="600">Negotiation</Subtitle2>
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
                        <Text fontWeight="600" width="30ch"> Negotiation Id: </Text>
                        {negotiation['@id']}
                    </Box>
                    <Box display="flex" gap="1rem">
                        <Text fontWeight="600" width="30ch"> Agreement  Id: </Text>
                        <Text sx={{ wordBreak: 'break-all', width: '60ch' }}>{negotiation['edc:contractAgreementId']}</Text>
                    </Box>
                    <Box display="flex" gap="1rem">
                        <Text fontWeight="600" width="30ch"> Type: </Text>
                        {negotiation['edc:type']}
                    </Box>
                    <Box display="flex" gap="1rem">
                        <Text fontWeight="600" width="30ch"> State: </Text>
                        {negotiation['edc:state']}
                    </Box>
                    <Box display="flex" gap="1rem">
                        <Text fontWeight="600" width="30ch"> CounterParty: </Text>
                        {negotiation['edc:counterPartyId']}
                    </Box>
                    <Box display="flex" gap="1rem">
                        <Text fontWeight="600" width="30ch"> Counterparty EDC URL: </Text>
                        {negotiation['edc:counterPartyAddress']}
                    </Box>
                    <Box display="flex" gap="1rem">
                        <Text fontWeight="600" width="30ch"> Timestamp: </Text>
                        {new Date(negotiation['edc:createdAt']).toLocaleString()}
                    </Box>
                </Box>
            </Box>
        </Card>
    );
};

export const NegotiationView = () => {
    const { negotiations } = useNegotiations();
    return (
        <Box sx={{
            display: 'flex',
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <Subtitle>Negotiation</Subtitle>
            <List sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                width: '100ch'
            }}>
                {negotiations && negotiations.length > 0 ? (
                    negotiations.map((negotiation) => (
                        <ListItem>
                            <NegotiationCard negotiation={negotiation} />
                        </ListItem>
                    ))
                ) : (
                    <Text align="center">No negotiations found. This list will be updated when Negotiations happen.</Text>
                )}
            </List>
        </Box>
    );
}
