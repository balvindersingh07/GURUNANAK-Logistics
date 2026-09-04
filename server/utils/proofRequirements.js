/** Driver POD must include both photo and signature before delivered status */
export function hasRequiredProof(proof) {
  if (!proof) return false;
  return !!(proof.photoUrl && proof.signature);
}
