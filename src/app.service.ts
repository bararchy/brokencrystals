import { HttpException, Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users/users.service';
import { AppModuleConfigProperties } from './app.module.config.properties';
import { OrmModuleConfigProperties } from './orm/orm.module.config.properties';
import { AppConfig } from './app.config.api';
import { UserDto } from './users/api/UserDto';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService
  ) {}

  async launchCommand(command: string): Promise<string> {
    this.logger.debug(`launch ${command} command`);

    return new Promise((res, rej) => {
      try {
        const [exec, ...args] = command.split(' ');

        // Validate the command to prevent command injection
        if (!this.isValidCommand(exec, args)) {
          throw new Error('Invalid command');
        }

        const ps = spawn(exec, args);

        ps.stdout.on('data', (data: Buffer) => {
          this.logger.debug(`stdout: ${data}`);
          res(data.toString('ascii'));
        });

        ps.stderr.on('data', (data: Buffer) => {
          this.logger.debug(`stderr: ${data}`);
          res(data.toString('ascii'));
        });

        ps.on('error', (err) => rej(err.message));

        ps.on('close', (code) =>
          this.logger.debug(`child process exited with code ${code}`)
        );
      } catch (err) {
        rej(err.message);
      }
    });
  }

  private isValidCommand(exec: string, args: string[]): boolean {
    // Define a list of allowed commands and arguments
    const allowedCommands = ['ls', 'cat'];
    const allowedArgs = ['-la', '/etc/hosts'];

    // Check if the command is in the allowed list
    if (!allowedCommands.includes(exec)) {
      return false;
    }

    // Check if all arguments are in the allowed list
    for (const arg of args) {
      if (!allowedArgs.includes(arg)) {
        return false;
      }
    }

    return true;
  }

  getConfig(): AppConfig {
    this.logger.debug('Called getConfig');
    const dbSchema = this.configService.get<string>(
        OrmModuleConfigProperties.ENV_DATABASE_SCHEMA
      ),
      dbHost = this.configService.get<string>(
        OrmModuleConfigProperties.ENV_DATABASE_HOST
      ),
      dbPort = this.configService.get<string>(
        OrmModuleConfigProperties.ENV_DATABASE_PORT
      ),
      dbUser = this.configService.get<string>(
        OrmModuleConfigProperties.ENV_DATABASE_USER
      ),
      dbPwd = this.configService.get<string>(
        OrmModuleConfigProperties.ENV_DATABASE_PASSWORD
      );

    return {
      awsBucket: this.configService.get<string>(
        AppModuleConfigProperties.ENV_AWS_BUCKET
      ),
      sql: `postgres://${dbUser}:${dbPwd}@${dbHost}:${dbPort}/${dbSchema} `,
      googlemaps: this.configService.get<string>(
        AppModuleConfigProperties.ENV_GOOGLE_MAPS
      )
    };
  }

  getSecrets(): Record<string, string> {
    return {
      codeclimate: this.configService.get<string>('CODECLIMATE_REPO_TOKEN'),
      facebook: this.configService.get<string>('FACEBOOK_TOKEN'),
      google_b64: this.configService.get<string>('GOOGLE_B64'),
      google_oauth: this.configService.get<string>('GOOGLE_OAUTH'),
      google_oauth_token: this.configService.get<string>('GOOGLE_OAUTH_TOKEN'),
      heroku: this.configService.get<string>('HEROKU_TOKEN'),
      hockey_app: this.configService.get<string>('HOCKEY_APP_TOKEN'),
      outlook: this.configService.get<string>('OUTLOOK_WEBHOOK'),
      paypal: this.configService.get<string>('PAYPAL_ACCESS_TOKEN'),
      slack: this.configService.get<string>('SLACK_TOKEN')
    };
  }

  async getUserInfo(email: string): Promise<UserDto> {
    try {
      this.logger.debug(`Find a user by email: ${email}`);
      return new UserDto(await this.userService.findByEmail(email));
    } catch (err) {
      throw new HttpException(err.message, err.status);
    }
  }
}
