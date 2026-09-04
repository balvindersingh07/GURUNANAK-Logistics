import type { ProofOfDelivery } from '../types';

/** Driver must complete photo + signature before marking delivered */
export function hasRequiredProof(proof?: ProofOfDelivery | null): boolean {
  return !!(proof?.photoUrl && proof?.signature);
}
