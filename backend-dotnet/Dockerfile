FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY TaskBoard.sln ./
COPY src/TaskBoard.Api/TaskBoard.Api.csproj src/TaskBoard.Api/
COPY tests/TaskBoard.Api.Tests/TaskBoard.Api.Tests.csproj tests/TaskBoard.Api.Tests/
RUN dotnet restore TaskBoard.sln

COPY . .
RUN dotnet publish src/TaskBoard.Api/TaskBoard.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:5088
EXPOSE 5088

ENTRYPOINT ["dotnet", "TaskBoard.Api.dll"]
