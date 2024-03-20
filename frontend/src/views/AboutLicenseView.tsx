/*
Copyright (c) 2023,2024 Volkswagen AG
Copyright (c) 2023,2024 Fraunhofer-Gesellschaft zur Foerderung der angewandten Forschung e.V. (represented by Fraunhofer ISST)
Copyright (c) 2023,2024 Contributors to the Eclipse Foundation

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

import { Box, Link, Typography } from '@mui/material';
import aboutPage from '@assets/aboutPage.json';
import { Table } from '@catena-x/portal-shared-components';

const aboutPageColumns = [
    {
        field: 'header',
        headerName: '',
        flex: 3,
    },
    {
        field: 'body',
        headerName: '',
        renderCell: (data: { row: { body: string; link: string | null } }) => data.row['link'] ? (
            <Link href={data.row.link}>
                {data.row.body}
            </Link>
        ) : (
            data.row.body
        ),
        flex: 8,
    },
];

export const AboutLicenseView = () => {
    return (
        <Box sx={{ display: 'flex', height: '100%', width: '100%', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h4" mb="1rem">About License</Typography>
            <Box width="32rem">
                <Table
                    columnHeaderHeight={0}
                    title='License Information'
                    hideFooter={true}
                    columns={aboutPageColumns}
                    getRowId={(row) => row.header}
                    rows={aboutPage}
                />
            </Box>
        </Box>
    );
}
