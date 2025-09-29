import Ajv from 'ajv';
import schema from '../../lib/schema/policy-bundle.schema.json' assert { type: 'json' };

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

function formatPath(instancePath, missingProperty) {
  const pointer = instancePath ? instancePath.replace(/^\//, '').replace(/\//g, '.') : '';
  if (missingProperty) {
    return pointer ? `${pointer}.${missingProperty}` : missingProperty;
  }
  return pointer || 'policy';
}

function formatError(error) {
  switch (error.keyword) {
    case 'required': {
      const field = formatPath(error.instancePath, error.params?.missingProperty);
      return `${field} is required`;
    }
    case 'minLength': {
      const field = formatPath(error.instancePath);
      return `${field} must be a non-empty string`;
    }
    case 'minItems': {
      const field = formatPath(error.instancePath);
      return `${field} must contain at least one item`;
    }
    case 'enum': {
      const field = formatPath(error.instancePath);
      const allowed = Array.isArray(error.params?.allowedValues)
        ? error.params.allowedValues.join(', ')
        : '';
      return `${field} must be one of ${allowed}`.trim();
    }
    default: {
      const field = formatPath(error.instancePath);
      const message = error.message ?? 'is invalid';
      return `${field} ${message}`;
    }
  }
}

export function validatePolicyBundle(policy) {
  const valid = validate(policy);
  if (!valid) {
    const errors = (validate.errors ?? []).map(formatError);
    return { valid: false, errors };
  }
  return { valid: true, errors: [] };
}

export function isPolicySigned(policy) {
  return policy?.signature?.status === 'signed';
}

export const __testables = { validatePolicyBundle };
