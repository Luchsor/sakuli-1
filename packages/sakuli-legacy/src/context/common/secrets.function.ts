import {secret} from "@nut-tree/secrets";
import {EncryptionError} from "./exceptions/encryptionerror.class";
import {Project} from "@sakuli/core";
import {Maybe, Property} from "@sakuli/commons";

export const MASTERKEY_ENV_KEY = "SAKULI_ENCRYPTION_KEY";
export const MASTERKEY_CLI_KEY = "masterkey";
export const MASTERKEY_PROPERTY_KEY = "sakuli.encryption.key";

class MasterKeyProps {
    @Property(MASTERKEY_ENV_KEY)
    environmentKey: Maybe<string>;

    @Property(MASTERKEY_CLI_KEY)
    cliKey: Maybe<string>;

    @Property(MASTERKEY_PROPERTY_KEY)
    propsKey: Maybe<string>
}

export const getEncryptionKey = (project: Project) => {
    const keyProps = project.objectFactory(MasterKeyProps);
    const key = keyProps.cliKey || keyProps.propsKey || keyProps.environmentKey;
    if (!key) {
        throw new Error(`Masterkey could not be found in one of '--masterkey' CLI option, 'sakuli.encryption.key' property or '${MASTERKEY_ENV_KEY}' env var. Missing master key for secrets.`);
    }
    return key;
};

export async function decrypt(key: string, encryptedInput: string): Promise<string> {
    try {
        return secret.decrypt(encryptedInput, key);
    } catch (e) {
        throw new EncryptionError(e.message);
    }
}

export async function withEncryption<T>(key: string, encryptedInput: string, action: (input: string) => Promise<T>): Promise<T> {
    try {
        const decrypted = await secret.decrypt(encryptedInput, key);
        return action(decrypted);
    } catch (e) {
        throw new EncryptionError(e.message);
    }
}
