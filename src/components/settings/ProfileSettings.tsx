import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";
import { countries } from "@/data/countries";

interface ProfileSettingsProps {
  name: string;
  setName: (name: string) => void;
  email: string;
  country: string;
  setCountry: (country: string) => void;
  sex: string;
  setSex: (sex: string) => void;
  age: string;
  setAge: (age: string) => void;
  loading: boolean;
  saving: boolean;
  onSave: () => void;
}

const ProfileSettings = ({
  name,
  setName,
  email,
  country,
  setCountry,
  sex,
  setSex,
  age,
  setAge,
  loading,
  saving,
  onSave
}: ProfileSettingsProps) => {
  return (
    <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="pb-6 bg-gradient-to-r from-purple-50 to-blue-50 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full transform translate-x-8 -translate-y-8"></div>
        <div className="relative z-10">
          <CardTitle className="flex items-center space-x-4 text-2xl">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg">
              <User className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
                Profile Information
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Secure</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-base text-gray-600 mt-3">
            Update your personal information and account details to personalize your experience
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading your profile...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-bold text-gray-800 flex items-center space-x-2">
                  <span>Full Name</span>
                  <div className="px-2 py-1 bg-purple-100 rounded-full">
                    <span className="text-xs font-semibold text-purple-700">Required</span>
                  </div>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-inner transition-all duration-300"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-bold text-gray-800 flex items-center space-x-2">
                  <span>Email Address</span>
                  <div className="px-2 py-1 bg-gray-100 rounded-full">
                    <span className="text-xs font-semibold text-gray-600">Read-only</span>
                  </div>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="h-12 border-2 border-gray-200 bg-gray-50 text-gray-600 rounded-xl shadow-inner"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="country" className="text-sm font-bold text-gray-800">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-inner transition-all duration-300">
                    <SelectValue placeholder="Select your country">
                      {country && (
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{countries.find(c => c.name === country)?.flag}</span>
                          <span>{country}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-48 overflow-y-auto rounded-2xl border-0 shadow-2xl">
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.name} className="rounded-xl my-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{c.flag}</span>
                          <span>{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="age" className="text-sm font-bold text-gray-800">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                  className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-inner transition-all duration-300"
                />
              </div>
              <div className="space-y-3 md:col-span-2">
                <Label htmlFor="sex" className="text-sm font-bold text-gray-800">Gender</Label>
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-inner transition-all duration-300">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-0 shadow-2xl">
                    <SelectItem value="male" className="rounded-xl my-1">👨 Male</SelectItem>
                    <SelectItem value="female" className="rounded-xl my-1">👩 Female</SelectItem>
                    <SelectItem value="other" className="rounded-xl my-1">🌈 Other</SelectItem>
                    <SelectItem value="prefer-not-to-say" className="rounded-xl my-1">🤐 Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={onSave}
                disabled={saving}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center justify-center">
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <User className="mr-3 h-6 w-6 group-hover:animate-pulse" />
                      <span>Save Profile Changes</span>
                      <div className="ml-3 px-2 py-1 bg-white/20 rounded-full text-xs">
                        ✨ Secure
                      </div>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;