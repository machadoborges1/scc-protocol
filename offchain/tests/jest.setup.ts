import { testClient } from '../lib/viem';

let snapshotId: `0x${string}`;

beforeEach(async () => {
  snapshotId = await testClient.snapshot();
});

afterEach(async () => {
  await testClient.revert({ id: snapshotId });
});