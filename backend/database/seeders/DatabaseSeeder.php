<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $accounts = [
            ['email' => 'admin@example.com',    'user_role' => User::ROLE_ADMIN,    'first_name' => 'System',  'last_name' => 'Admin'],
            ['email' => 'hr@example.com',       'user_role' => User::ROLE_HR,       'first_name' => 'Hannah',  'last_name' => 'Reyes'],
            ['email' => 'payroll@example.com',  'user_role' => User::ROLE_PAYROLL,  'first_name' => 'Paolo',   'last_name' => 'Santos'],
            ['email' => 'head@example.com',     'user_role' => User::ROLE_HEAD,     'first_name' => 'Henry',   'last_name' => 'Cruz'],
            ['email' => 'employee@example.com', 'user_role' => User::ROLE_EMPLOYEE, 'first_name' => 'Emma',    'last_name' => 'Garcia'],
        ];

        foreach ($accounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'first_name' => $account['first_name'],
                    'last_name'  => $account['last_name'],
                    'password'   => 'password', // auto-hashed by the 'hashed' cast
                    'user_role'  => $account['user_role'],
                    'status'     => User::STATUS_ACTIVE,
                ]
            );
        }

        // Optional: accounts to test the login status check
        User::updateOrCreate(
            ['email' => 'deactivated@example.com'],
            [
                'first_name' => 'Dina',
                'last_name'  => 'Lopez',
                'password'   => 'password',
                'user_role'  => User::ROLE_EMPLOYEE,
                'status'     => User::STATUS_DEACTIVATED,
            ]
        );

        User::updateOrCreate(
            ['email' => 'inactive@example.com'],
            [
                'first_name' => 'Ian',
                'last_name'  => 'Mendoza',
                'password'   => 'password',
                'user_role'  => User::ROLE_EMPLOYEE,
                'status'     => User::STATUS_INACTIVE,
            ]
        );
    }
}