/*
Copyright (c) 2022 Volkswagen AG
Copyright (c) 2022 Fraunhofer-Gesellschaft zur Foerderung der angewandten Forschung e.V. (represented by Fraunhofer ISST)
Copyright (c) 2022 Contributors to the Eclipse Foundation

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
import { useNegotiations } from '@hooks/edc/useNegotiations';
import { Table } from '@catena-x/portal-shared-components';
import { Box } from '@mui/material';
import { ConfidentialBanner } from '@components/ConfidentialBanner';

export const NegotiationView = () => {
    const { negotiations } = useNegotiations();
    return (
        <div className="flex flex-col items-center w-full h-full">
            <Box width="100%" sx={{ display: 'flex', flexDirection: 'column', gap: 3}}>
                <ConfidentialBanner />
                <Table
                    title="Negotiation history"
                    columns={[
                        { headerName: 'Negotiation Id', field: '@id', flex: 1 },
                        { headerName: 'Agreement Id', field: 'contractAgreementId', flex: 1 },
                        { headerName: 'Type', field: 'type', flex: 1 },
                        { headerName: 'State', field: 'state', flex: 1 },
                        { headerName: 'CounterParty', field: 'counterPartyId', flex: 1 },
                        { headerName: 'Counterparty EDC URL', field: 'counterPartyAddress', flex: 1 },
                        {
                            headerName: 'Timestamp',
                            field: 'createdAt',
                            flex: 1,
                            valueFormatter: (params) => new Date(params.value).toLocaleString(),
                        },
                    ]}
                    rows={negotiations ?? []}
                    getRowId={(row) => row['@id']}
                />
            </Box>
        </div>
    );
};
