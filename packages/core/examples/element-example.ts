import { element, getElementMeta, isElement } from '../src/element';
import type { Any } from '../src/generics';

/**
 * element-001: Basic element creation with required metadata.
 */
function elementBasicCreation() {
  console.log('\nelement-001: Basic element creation with required metadata.');
  const userData = { name: 'John', age: 30 };
  const elementInstance = element(userData, {
    hash: 'user-123',
    tag: 'Value',
    doc: 'User information element',
  });

  // Demonstrate the element structure
  console.log('Element created:', elementInstance);
  console.log('Element name:', elementInstance.name);
  console.log('Element age:', elementInstance.age);
  console.log('Element metadata:', (elementInstance as Any)['~meta']);
}

/**
 * element-002: Element creation without documentation.
 */
function elementCreationWithoutDoc() {
  console.log('\nelement-002: Element creation without documentation.');
  const configData = { port: 8080, host: 'localhost' };
  const elementInstance = element(configData, {
    hash: 'config-456',
    tag: 'Schema',
  });

  // Demonstrate the element structure
  console.log('Element created:', elementInstance);
  console.log('Element port:', elementInstance.port);
  console.log('Element host:', elementInstance.host);
  console.log('Element metadata:', (elementInstance as Any)['~meta']);
}

/**
 * element-003: Retrieving element metadata.
 */
function elementRetrieveMetadata() {
  console.log('\nelement-003: Retrieving element metadata.');
  const userData = { name: 'John', age: 30 };
  const elementInstance = element(userData, {
    hash: 'user-123',
    tag: 'Value',
    doc: 'User information',
  });
  const metadata = getElementMeta(elementInstance);

  // Demonstrate metadata retrieval
  console.log('Original element:', elementInstance);
  console.log('Retrieved metadata:', metadata);

  if (metadata) {
    console.log('Metadata tag:', metadata._tag);
    console.log('Metadata hash:', metadata._hash);
    console.log('Metadata doc:', metadata._doc);
    console.log('Metadata id:', metadata._id);
  }
}

/**
 * element-004: Checking if an element is of a specific tag.
 */
function elementCheckTag() {
  console.log('\nelement-004: Checking if an element is of a specific tag.');
  const userData = { name: 'John', age: 30 };
  const elementInstance = element(userData, {
    hash: 'user-123',
    tag: 'Value',
    doc: 'User information',
  });
  const isUserElement = isElement(elementInstance, 'Value');

  // Demonstrate tag checking
  console.log('Element:', elementInstance);
  console.log('Is Value element:', isUserElement);
  console.log('Is Aggregate element:', isElement(elementInstance, 'Aggregate'));
  console.log('Is Schema element:', isElement(elementInstance, 'Schema'));
}

elementBasicCreation();
elementCreationWithoutDoc();
elementRetrieveMetadata();
elementCheckTag();
